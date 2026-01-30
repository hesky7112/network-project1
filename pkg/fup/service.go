package fup

import (
	"context"
	"networking-main/internal/models"
	"time"

	"gorm.io/gorm"
)

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

// CheckFUPStatus checks if a user has exceeded their data limits
func (s *Service) CheckFUPStatus(ctx context.Context, userID uint, packageID uint) (bool, error) {
	var fupConfig models.FUPConfig
	err := s.db.WithContext(ctx).Where("package_id = ?", packageID).First(&fupConfig).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, nil // No FUP for this package
		}
		return false, err
	}

	// Calculate usage (simplified - sum of InputOctets + OutputOctets from RadiusSessions)
	var totalUsage int64
	s.db.WithContext(ctx).Model(&models.RadiusSession{}).
		Where("user_id = ? AND created_at > ?", userID, time.Now().AddDate(0, 0, -1)). // Daily check
		Select("SUM(input_octets + output_octets)").
		Scan(&totalUsage)

	if fupConfig.DailyLimit > 0 && totalUsage >= fupConfig.DailyLimit {
		return true, nil
	}

	// Monthly check
	var monthlyUsage int64
	s.db.WithContext(ctx).Model(&models.RadiusSession{}).
		Where("user_id = ? AND created_at > ?", userID, time.Now().AddDate(0, -1, 0)).
		Select("SUM(input_octets + output_octets)").
		Scan(&monthlyUsage)

	if fupConfig.MonthlyLimit > 0 && monthlyUsage >= fupConfig.MonthlyLimit {
		return true, nil
	}

	return false, nil
}

// GetThrottledSpeeds returns the speeds a user should be limited to
func (s *Service) GetThrottledSpeeds(ctx context.Context, packageID uint) (int, int, error) {
	var fupConfig models.FUPConfig
	err := s.db.WithContext(ctx).Where("package_id = ?", packageID).First(&fupConfig).Error
	if err != nil {
		return 0, 0, err
	}
	return fupConfig.ThrottledDown, fupConfig.ThrottledUp, nil
}

// GetUsageStats returns the current usage and the limit for the user
func (s *Service) GetUsageStats(ctx context.Context, userID uint, packageID uint) (int64, int64, error) {
	var fupConfig models.FUPConfig
	// Get FUP config for package
	err := s.db.WithContext(ctx).Where("package_id = ?", packageID).First(&fupConfig).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return 0, 0, nil // No FUP, infinite limit
		}
		return 0, 0, err
	}

	// Calculate usage (simplified - sum of InputOctets + OutputOctets from RadiusSessions)
	// Default to daily check priority
	var totalUsage int64
	var limit int64

	if fupConfig.DailyLimit > 0 {
		limit = fupConfig.DailyLimit
		s.db.WithContext(ctx).Model(&models.RadiusSession{}).
			Where("user_id = ? AND created_at > ?", userID, time.Now().AddDate(0, 0, -1)).
			Select("COALESCE(SUM(input_octets + output_octets), 0)").
			Scan(&totalUsage)
	} else if fupConfig.MonthlyLimit > 0 {
		limit = fupConfig.MonthlyLimit
		s.db.WithContext(ctx).Model(&models.RadiusSession{}).
			Where("user_id = ? AND created_at > ?", userID, time.Now().AddDate(0, -1, 0)).
			Select("COALESCE(SUM(input_octets + output_octets), 0)").
			Scan(&totalUsage)
	}

	return totalUsage, limit, nil
}
