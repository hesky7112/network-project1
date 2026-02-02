package auth

import (
	"encoding/json"
	"errors"
	"regexp"
	"time"

	"gorm.io/gorm"
)

// RBACManager handles Role-Based Access Control
type RBACManager struct {
	db *gorm.DB
}

// Role represents a user role
type Role struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	ParentID    *uint     `json:"parent_id" gorm:"index"` // Support for Hierarchical RBAC
	Name        string    `json:"name" gorm:"uniqueIndex"`
	Description string    `json:"description"`
	Permissions string    `json:"permissions" gorm:"type:jsonb"`
	Level       int       `json:"level"` // 1=Admin, 2=Manager, 3=Technician, 4=Viewer
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Permission represents a specific permission
type Permission struct {
	Resource string   `json:"resource"` // devices, configs, reports, etc.
	Actions  []string `json:"actions"`  // read, write, delete, execute
}

// UserRole links users to roles
type UserRole struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	UserID     uint      `json:"user_id" gorm:"index"`
	RoleID     uint      `json:"role_id" gorm:"index"`
	AssignedBy uint      `json:"assigned_by"`
	AssignedAt time.Time `json:"assigned_at"`
}

// AuditLog tracks all access and actions
type AuditLog struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	UserID     uint      `json:"user_id" gorm:"index"`
	Username   string    `json:"username"`
	Action     string    `json:"action"`
	Resource   string    `json:"resource"`
	ResourceID uint      `json:"resource_id"`
	IPAddress  string    `json:"ip_address"`
	UserAgent  string    `json:"user_agent"`
	Success    bool      `json:"success"`
	Details    string    `json:"details"`
	OldState   string    `json:"old_state" gorm:"type:jsonb"` // Captured state before change
	NewState   string    `json:"new_state" gorm:"type:jsonb"` // Captured state after change
	Timestamp  time.Time `json:"timestamp" gorm:"index"`
}

// NewRBACManager creates a new RBAC manager
func NewRBACManager(db *gorm.DB) *RBACManager {
	rbac := &RBACManager{db: db}
	rbac.initializeDefaultRoles()
	return rbac
}

// initializeDefaultRoles creates default system roles
func (rbac *RBACManager) initializeDefaultRoles() {
	defaultRoles := []Role{
		{
			Name:        "Super Admin",
			Description: "Full system access",
			Level:       1,
			Permissions: `{
				"devices": ["read", "write", "delete", "execute"],
				"configs": ["read", "write", "delete", "execute"],
				"users": ["read", "write", "delete"],
				"roles": ["read", "write", "delete"],
				"reports": ["read", "write", "delete", "export"],
				"health": ["read", "write", "execute"],
				"tickets": ["read", "write", "delete", "assign"],
				"chat": ["read", "write", "delete"],
				"topology": ["read", "write", "execute"],
				"telemetry": ["read", "write", "execute"],
				"onboarding": ["read", "write"],
				"modules": ["read", "write", "execute", "purchase"],
				"tasks": ["read", "execute"],
				"audit": ["read"]
			}`,
		},
		{
			Name:        "Network Admin",
			Description: "Network management access",
			Level:       2,
			Permissions: `{
				"devices": ["read", "write", "execute"],
				"configs": ["read", "write", "execute"],
				"reports": ["read", "write", "export"],
				"health": ["read", "write", "execute"],
				"tickets": ["read", "write", "assign"],
				"chat": ["read", "write"],
				"topology": ["read", "execute"],
				"telemetry": ["read"],
				"modules": ["read", "execute", "purchase"],
				"tasks": ["read", "execute"]
			}`,
		},
		{
			Name:        "Technician",
			Description: "Field technician access",
			Level:       3,
			Permissions: `{
				"devices": ["read"],
				"configs": ["read"],
				"reports": ["read", "write"],
				"health": ["read"],
				"tickets": ["read", "write"],
				"chat": ["read", "write"],
				"topology": ["read"]
			}`,
		},
		{
			Name:        "Viewer",
			Description: "Read-only access",
			Level:       4,
			Permissions: `{
				"devices": ["read"],
				"configs": ["read"],
				"reports": ["read"],
				"health": ["read"],
				"tickets": ["read"],
				"chat": ["read"],
				"topology": ["read"]
			}`,
		},
	}

	for _, role := range defaultRoles {
		var existing Role
		result := rbac.db.Where("name = ?", role.Name).First(&existing)
		if result.Error == gorm.ErrRecordNotFound {
			rbac.db.Create(&role)
		} else {
			// Ensure existing role is updated with latest permissions from code
			existing.Permissions = role.Permissions
			existing.Level = role.Level
			existing.Description = role.Description
			rbac.db.Save(&existing)
		}
	}
}

// AssignRole assigns a role to a user
func (rbac *RBACManager) AssignRole(userID, roleID, assignedBy uint) error {
	// Check if role exists
	var role Role
	if err := rbac.db.First(&role, roleID).Error; err != nil {
		return errors.New("role not found")
	}

	// Check if already assigned
	var existing UserRole
	result := rbac.db.Where("user_id = ? AND role_id = ?", userID, roleID).First(&existing)
	if result.Error == nil {
		return errors.New("role already assigned")
	}

	userRole := &UserRole{
		UserID:     userID,
		RoleID:     roleID,
		AssignedBy: assignedBy,
		AssignedAt: time.Now(),
	}

	return rbac.db.Create(userRole).Error
}

// RemoveRole removes a role from a user
func (rbac *RBACManager) RemoveRole(userID, roleID uint) error {
	return rbac.db.Where("user_id = ? AND role_id = ?", userID, roleID).Delete(&UserRole{}).Error
}

// CreateRole creates a new custom role
func (rbac *RBACManager) CreateRole(role *Role) error {
	// Ensure custom roles don't hijack system levels
	if role.Level <= 4 {
		role.Level = 5
	}
	return rbac.db.Create(role).Error
}

// UpdateRole updates an existing role
func (rbac *RBACManager) UpdateRole(role *Role) error {
	if role.ID <= 4 || role.Level <= 4 {
		return errors.New("system roles cannot be modified")
	}

	// Fetch old role to check for name changes
	var oldRole Role
	if err := rbac.db.First(&oldRole, role.ID).Error; err != nil {
		return err
	}

	if err := rbac.db.Save(role).Error; err != nil {
		return err
	}

	// Propagate name change to User table for JWT claim consistency
	if oldRole.Name != role.Name {
		// Use raw SQL to sidestep models dependency and ensure fast bulk update
		rbac.db.Exec("UPDATE users SET role = ? WHERE id IN (SELECT user_id FROM user_roles WHERE role_id = ?)",
			role.Name, role.ID)
	}

	return nil
}

// DeleteRole removes a custom role
func (rbac *RBACManager) DeleteRole(roleID uint) error {
	var role Role
	if err := rbac.db.First(&role, roleID).Error; err != nil {
		return err
	}
	if role.Level <= 4 {
		return errors.New("system roles cannot be deleted")
	}
	// Also clean up user assignments
	rbac.db.Where("role_id = ?", roleID).Delete(&UserRole{})
	return rbac.db.Delete(&role).Error
}

// GetAllRoles retrieves all roles
func (rbac *RBACManager) GetAllRoles() ([]Role, error) {
	var roles []Role
	err := rbac.db.Find(&roles).Order("level ASC").Error
	return roles, err
}

// GetRoleByID retrieves a specific role
func (rbac *RBACManager) GetRoleByID(roleID uint) (Role, error) {
	var role Role
	err := rbac.db.First(&role, roleID).Error
	return role, err
}

// GetUserRoles retrieves all roles for a user
func (rbac *RBACManager) GetUserRoles(userID uint) ([]Role, error) {
	var roles []Role
	err := rbac.db.Raw(`
		SELECT r.* FROM roles r
		INNER JOIN user_roles ur ON r.id = ur.role_id
		WHERE ur.user_id = ?
	`, userID).Scan(&roles).Error
	return roles, err
}

// HasPermission checks if user has specific permission
func (rbac *RBACManager) HasPermission(userID uint, resource, action string) bool {
	roles, err := rbac.GetUserRoles(userID)
	if err != nil {
		return false
	}

	for _, role := range roles {
		if rbac.checkRolePermission(role, resource, action, make(map[uint]bool)) {
			return true
		}
	}

	return false
}

// checkRolePermission recursively checks permissions and inheritance
func (rbac *RBACManager) checkRolePermission(role Role, resource, action string, visited map[uint]bool) bool {
	if visited[role.ID] {
		return false // Prevent circular inheritance
	}
	visited[role.ID] = true

	// Check current role permissions
	var permissions map[string][]string
	if err := json.Unmarshal([]byte(role.Permissions), &permissions); err == nil {
		if actions, ok := permissions[resource]; ok {
			for _, a := range actions {
				if a == action {
					return true
				}
			}
		}
	}

	// Check parent permissions
	if role.ParentID != nil {
		var parent Role
		if err := rbac.db.First(&parent, *role.ParentID).Error; err == nil {
			return rbac.checkRolePermission(parent, resource, action, visited)
		}
	}

	return false
}

// LogAccess logs user access and actions
func (rbac *RBACManager) LogAccess(userID uint, username, action, resource string, resourceID uint, ipAddress, userAgent string, success bool, details string) {
	rbac.LogAccessWithState(userID, username, action, resource, resourceID, ipAddress, userAgent, success, details, "", "")
}

// LogAccessWithState captures state snapshots for advanced auditing
func (rbac *RBACManager) LogAccessWithState(userID uint, username, action, resource string, resourceID uint, ipAddress, userAgent string, success bool, details, oldState, newState string) {
	log := &AuditLog{
		UserID:     userID,
		Username:   username,
		Action:     action,
		Resource:   resource,
		ResourceID: resourceID,
		IPAddress:  ipAddress,
		UserAgent:  userAgent,
		Success:    success,
		Details:    MaskPII(details),
		OldState:   oldState,
		NewState:   newState,
		Timestamp:  time.Now(),
	}

	rbac.db.Create(log)
}

// GetAuditLogs retrieves audit logs with filters
func (rbac *RBACManager) GetAuditLogs(userID *uint, resource string, startDate, endDate time.Time, limit int) ([]AuditLog, error) {
	var logs []AuditLog
	query := rbac.db.Model(&AuditLog{})

	if userID != nil {
		query = query.Where("user_id = ?", *userID)
	}

	if resource != "" {
		query = query.Where("resource = ?", resource)
	}

	if !startDate.IsZero() {
		query = query.Where("timestamp >= ?", startDate)
	}

	if !endDate.IsZero() {
		query = query.Where("timestamp <= ?", endDate)
	}

	err := query.Order("timestamp DESC").Limit(limit).Find(&logs).Error
	return logs, err
}

// GetUserActivity gets user activity summary
func (rbac *RBACManager) GetUserActivity(userID uint, days int) (map[string]interface{}, error) {
	startDate := time.Now().AddDate(0, 0, -days)

	var totalActions int64
	rbac.db.Model(&AuditLog{}).Where("user_id = ? AND timestamp >= ?", userID, startDate).Count(&totalActions)

	var successfulActions int64
	rbac.db.Model(&AuditLog{}).Where("user_id = ? AND timestamp >= ? AND success = ?", userID, startDate, true).Count(&successfulActions)

	var actionsByResource []struct {
		Resource string
		Count    int64
	}
	rbac.db.Model(&AuditLog{}).
		Select("resource, COUNT(*) as count").
		Where("user_id = ? AND timestamp >= ?", userID, startDate).
		Group("resource").
		Scan(&actionsByResource)

	return map[string]interface{}{
		"total_actions":       totalActions,
		"successful_actions":  successfulActions,
		"success_rate":        float64(successfulActions) / float64(totalActions) * 100,
		"actions_by_resource": actionsByResource,
	}, nil
}

// MaskPII masks personally identifiable information from strings
func MaskPII(input string) string {
	// Mask Emails
	emailRegex := regexp.MustCompile(`[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})`)
	masked := emailRegex.ReplaceAllStringFunc(input, func(email string) string {
		parts := emailRegex.FindStringSubmatch(email)
		if len(parts) < 2 {
			return email
		}
		// Return first character + *** + domain
		return string(email[0]) + "***@" + parts[1]
	})

	// Mask Phone Numbers (simple pattern)
	phoneRegex := regexp.MustCompile(`\b\d{3}[-.]?\d{3}[-.]?\d{4}\b`)
	masked = phoneRegex.ReplaceAllString(masked, "***-***-****")

	return masked
}
