package modules

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

// LicenseManager handles license validation and enforcement
type LicenseManager struct {
	DB *gorm.DB
}

// NewLicenseManager creates a new license manager
func NewLicenseManager(db *gorm.DB) *LicenseManager {
	return &LicenseManager{DB: db}
}

// --- License Creation ---

// CreatePreviewLicense grants a 7-day trial with limited executions
func (lm *LicenseManager) CreatePreviewLicense(userID uint, moduleID string) (*License, error) {
	// Check if user already has a license (preview or otherwise)
	existing, _ := lm.GetLicense(userID, moduleID)
	if existing != nil {
		return nil, errors.New("user already has a license for this module")
	}

	maxExec := 100
	expires := time.Now().AddDate(0, 0, 7) // 7 days

	license := &License{
		UserID:        userID,
		ModuleID:      moduleID,
		Type:          LicensePreview,
		StartsAt:      time.Now(),
		ExpiresAt:     &expires,
		MaxExecutions: &maxExec,
		IsActive:      true,
	}

	if err := lm.DB.Create(license).Error; err != nil {
		return nil, err
	}

	return license, nil
}

// CreateLeaseLicense grants a monthly subscription
func (lm *LicenseManager) CreateLeaseLicense(userID uint, moduleID string, transactionID string, amount float64) (*License, error) {
	expires := time.Now().AddDate(0, 1, 0) // 1 month

	license := &License{
		UserID:        userID,
		ModuleID:      moduleID,
		Type:          LicenseLease,
		StartsAt:      time.Now(),
		ExpiresAt:     &expires,
		TransactionID: transactionID,
		AmountPaid:    amount,
		IsActive:      true,
	}

	if err := lm.DB.Create(license).Error; err != nil {
		return nil, err
	}

	return license, nil
}

// CreatePurchaseLicense grants permanent access
func (lm *LicenseManager) CreatePurchaseLicense(userID uint, moduleID string, transactionID string, amount float64) (*License, error) {
	license := &License{
		UserID:        userID,
		ModuleID:      moduleID,
		Type:          LicensePurchase,
		StartsAt:      time.Now(),
		ExpiresAt:     nil, // Never expires
		TransactionID: transactionID,
		AmountPaid:    amount,
		IsActive:      true,
	}

	if err := lm.DB.Create(license).Error; err != nil {
		return nil, err
	}

	return license, nil
}

// --- License Validation ---

// GetLicense retrieves a user's license for a module
func (lm *LicenseManager) GetLicense(userID uint, moduleID string) (*License, error) {
	var license License
	err := lm.DB.Where("user_id = ? AND module_id = ?", userID, moduleID).
		Order("created_at DESC").
		First(&license).Error

	if err != nil {
		return nil, err
	}
	return &license, nil
}

// CanExecute checks if a user can run a module
func (lm *LicenseManager) CanExecute(userID uint, moduleID string) (bool, string) {
	license, err := lm.GetLicense(userID, moduleID)
	if err != nil {
		return false, "No license found. Please purchase or start a preview."
	}

	if !license.IsActive {
		return false, "License is deactivated."
	}

	// Check expiration
	if license.ExpiresAt != nil && time.Now().After(*license.ExpiresAt) {
		return false, "License has expired. Please renew."
	}

	// Check execution limit (preview mode)
	if license.Type == LicensePreview && license.MaxExecutions != nil {
		if license.ExecutionCount >= *license.MaxExecutions {
			return false, "Preview execution limit reached. Please purchase."
		}
	}

	return true, ""
}

// IncrementExecution records a module run
func (lm *LicenseManager) IncrementExecution(licenseID uint) error {
	return lm.DB.Model(&License{}).
		Where("id = ?", licenseID).
		UpdateColumn("execution_count", gorm.Expr("execution_count + 1")).Error
}

// --- License Management ---

// GetUserLicenses returns all licenses for a user
func (lm *LicenseManager) GetUserLicenses(userID uint) ([]License, error) {
	var licenses []License
	err := lm.DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&licenses).Error
	return licenses, err
}

// RenewLease extends a lease license by another month
func (lm *LicenseManager) RenewLease(licenseID uint, transactionID string, amount float64) error {
	var license License
	if err := lm.DB.First(&license, licenseID).Error; err != nil {
		return err
	}

	if license.Type != LicenseLease {
		return errors.New("can only renew lease licenses")
	}

	// Extend by 1 month from today or current expiry (whichever is later)
	var newExpiry time.Time
	if license.ExpiresAt != nil && license.ExpiresAt.After(time.Now()) {
		newExpiry = license.ExpiresAt.AddDate(0, 1, 0)
	} else {
		newExpiry = time.Now().AddDate(0, 1, 0)
	}

	return lm.DB.Model(&license).Updates(map[string]interface{}{
		"expires_at":     newExpiry,
		"transaction_id": transactionID,
		"amount_paid":    gorm.Expr("amount_paid + ?", amount),
		"is_active":      true,
	}).Error
}

// DeactivateLicense disables a license (for refunds, violations, etc.)
func (lm *LicenseManager) DeactivateLicense(licenseID uint) error {
	return lm.DB.Model(&License{}).
		Where("id = ?", licenseID).
		Update("is_active", false).Error
}

// UpgradePreviewToPurchase converts a preview to permanent license
func (lm *LicenseManager) UpgradePreviewToPurchase(licenseID uint, transactionID string, amount float64) error {
	return lm.DB.Model(&License{}).
		Where("id = ?", licenseID).
		Updates(map[string]interface{}{
			"type":           LicensePurchase,
			"expires_at":     nil,
			"max_executions": nil,
			"transaction_id": transactionID,
			"amount_paid":    amount,
		}).Error
}

// --- Execution Logging ---

// LogExecution records a module run
func (lm *LicenseManager) LogExecution(log *ExecutionLog) error {
	return lm.DB.Create(log).Error
}

// GetExecutionStats returns usage statistics for a user
func (lm *LicenseManager) GetExecutionStats(userID uint) (map[string]interface{}, error) {
	var stats struct {
		TotalExecutions int64
		TotalDurationMs int64
		TotalInputBytes int64
	}

	err := lm.DB.Model(&ExecutionLog{}).
		Where("user_id = ?", userID).
		Select("COUNT(*) as total_executions, SUM(duration_ms) as total_duration_ms, SUM(input_size) as total_input_bytes").
		Scan(&stats).Error

	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"total_executions":  stats.TotalExecutions,
		"total_duration_ms": stats.TotalDurationMs,
		"total_input_bytes": stats.TotalInputBytes,
	}, nil
}
