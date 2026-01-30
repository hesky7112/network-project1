package probes

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

// RegisterProbe heartbeats a probe and updates its status
func (s *Service) RegisterHeartbeat(ctx context.Context, probeID uint, version string, ip string) error {
	return s.db.WithContext(ctx).Model(&models.RemoteProbe{}).Where("id = ?", probeID).Updates(map[string]interface{}{
		"last_seen":  time.Now(),
		"status":     "online",
		"version":    version,
		"ip_address": ip,
	}).Error
}

// RecordResult stores a measurement from a probe
func (s *Service) RecordResult(ctx context.Context, result *models.ProbeResult) error {
	return s.db.WithContext(ctx).Create(result).Error
}

// GetProbeLatency returns recent latency data for a probe
func (s *Service) GetProbeLatency(ctx context.Context, probeID uint, target string) ([]models.ProbeResult, error) {
	var results []models.ProbeResult
	err := s.db.WithContext(ctx).
		Where("probe_id = ? AND target = ?", probeID, target).
		Order("created_at desc").
		Limit(50).
		Find(&results).Error
	return results, err
}
