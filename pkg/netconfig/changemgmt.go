package netconfig

import (
	"context"
	"time"

	"gorm.io/gorm"
)

// ChangeRequest represents a request to change network configuration
type ChangeRequest struct {
	ID           uint       `json:"id" gorm:"primaryKey"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	RequesterID  uint       `json:"requester_id"`
	DeviceIDs    []uint     `json:"device_ids" gorm:"type:jsonb"`
	ProposedCmds string     `json:"proposed_cmds"` // Commands to execute
	RollbackCmds string     `json:"rollback_cmds"`
	Status       string     `json:"status"` // pending, approved, rejected, scheduled, completed, failed
	ScheduledAt  time.Time  `json:"scheduled_at"`
	ExecutedAt   *time.Time `json:"executed_at"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// Approval represents an approval for a change request
type ChangeApproval struct {
	ID              uint   `json:"id" gorm:"primaryKey"`
	ChangeRequestID uint   `json:"change_request_id"`
	ApproverID      uint   `json:"approver_id"`
	Status          string `json:"status"` // approved, rejected
	Comment         string `json:"comment"`
	CreatedAt       time.Time
}

// ChangeWindow represents an allowed time window for changes
type ChangeWindow struct {
	ID        uint   `json:"id" gorm:"primaryKey"`
	Name      string `json:"name"`
	DayOfWeek int    `json:"day_of_week"` // 0=Sunday, 6=Saturday
	StartTime string `json:"start_time"`  // "22:00"
	EndTime   string `json:"end_time"`    // "04:00"
	Actions   string `json:"actions"`     // allow, deny
	Active    bool   `json:"active"`
}

type ChangeManager struct {
	db *gorm.DB
}

func NewChangeManager(db *gorm.DB) *ChangeManager {
	return &ChangeManager{db: db}
}

// CreateChangeRequest submits a new change request
func (cm *ChangeManager) CreateChangeRequest(req *ChangeRequest) error {
	req.Status = "pending"
	return cm.db.Create(req).Error
}

// ApproveChangeRequest records an approval
func (cm *ChangeManager) ApproveChangeRequest(approval *ChangeApproval) error {
	return cm.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(approval).Error; err != nil {
			return err
		}

		// Check if we have enough approvals (e.g., 1 is enough for now)
		if approval.Status == "approved" {
			if err := tx.Model(&ChangeRequest{}).Where("id = ?", approval.ChangeRequestID).
				Update("status", "approved").Error; err != nil {
				return err
			}
		} else if approval.Status == "rejected" {
			if err := tx.Model(&ChangeRequest{}).Where("id = ?", approval.ChangeRequestID).
				Update("status", "rejected").Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// IsMaintenanceWindowActive checks if the current time falls within an active change window
func (cm *ChangeManager) IsMaintenanceWindowActive() (bool, error) {
	now := time.Now()
	day := int(now.Weekday())
	currentStr := now.Format("15:04")

	var windows []ChangeWindow
	if err := cm.db.Where("active = ? AND day_of_week = ?", true, day).Find(&windows).Error; err != nil {
		return false, err
	}

	for _, window := range windows {
		// Simple string comparison for HH:MM works if not crossing midnight
		// For midnight crossing (e.g. 22:00 to 04:00), logic needs to be robust

		if window.StartTime <= window.EndTime {
			// Normal range (e.g. 08:00 to 17:00)
			if currentStr >= window.StartTime && currentStr <= window.EndTime {
				return true, nil
			}
		} else {
			// Crossing midnight (e.g. 22:00 to 04:00)
			if currentStr >= window.StartTime || currentStr <= window.EndTime {
				return true, nil
			}
		}
	}

	return false, nil
}

// ExecuteScheduledChanges runs approved changes whose time has come
func (cm *ChangeManager) ExecuteScheduledChanges(ctx context.Context, executor func(req *ChangeRequest) error) error {
	var changes []ChangeRequest
	// Find approved changes scheduled for now or past
	if err := cm.db.Where("status = ? AND scheduled_at <= ?", "approved", time.Now()).Find(&changes).Error; err != nil {
		return err
	}

	for _, change := range changes {
		// Double check maintenance window if enforced
		// active, _ := cm.IsMaintenanceWindowActive()
		// if !active { continue }

		// Execute
		err := executor(&change)

		now := time.Now()
		if err != nil {
			cm.db.Model(&change).Updates(map[string]interface{}{"status": "failed", "executed_at": now})
			// Try rollback?
		} else {
			cm.db.Model(&change).Updates(map[string]interface{}{"status": "completed", "executed_at": now})
		}
	}
	return nil
}
