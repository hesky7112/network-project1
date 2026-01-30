package netconfig

import (
	"context"
	"fmt"
	"strings"
	"time"

	"networking-main/internal/models"

	"gorm.io/gorm"
)

// ComplianceManager handles configuration compliance and drift detection
type ComplianceManager struct {
	db            *gorm.DB
	configManager *ConfigManager
}

func NewComplianceManager(db *gorm.DB, cm *ConfigManager) *ComplianceManager {
	return &ComplianceManager{
		db:            db,
		configManager: cm,
	}
}

// ConfigDrift represents a detected configuration drift
type ConfigDrift struct {
	DeviceID       uint      `json:"device_id"`
	DeviceName     string    `json:"device_name"`
	DetectedAt     time.Time `json:"detected_at"`
	Diff           string    `json:"diff"`
	GoldenConfigID uint      `json:"golden_config_id"`
}

// DetectDrift checks if the device's running configuration differs from the golden config
func (cm *ComplianceManager) DetectDrift(ctx context.Context, deviceID uint) (*ConfigDrift, error) {
	var device models.Device
	if err := cm.db.First(&device, deviceID).Error; err != nil {
		return nil, fmt.Errorf("device not found: %w", err)
	}

	// 1. Get Golden Configuration (latest backup tagged 'golden' or just latest backup)
	var goldenBackup models.ConfigBackup
	err := cm.db.Where("device_id = ? AND tags LIKE ?", deviceID, "%golden%").
		Order("created_at desc").First(&goldenBackup).Error

	if err != nil {
		// Fallback to latest backup if no golden config found
		if err := cm.db.Where("device_id = ?", deviceID).Order("created_at desc").First(&goldenBackup).Error; err != nil {
			return nil, fmt.Errorf("no baseline config found for drift detection: %w", err)
		}
	}

	// 2. Get Current Running Configuration
	conn := DeviceConnection{
		IPAddress:  device.IPAddress,
		Username:   device.Username,
		Password:   device.Password,
		Port:       22,
		DeviceType: device.DeviceType,
	}

	runningConfig, err := cm.configManager.BackupDeviceConfig(conn)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch running config: %w", err)
	}

	// 3. Compare with Smart Drift Detector
	detector := NewSmartDriftDetector()
	diff, hasDrift := detector.Compare(goldenBackup.Config, runningConfig)

	if !hasDrift {
		return nil, nil // No meaningful drift
	}

	drift := &ConfigDrift{
		DeviceID:       device.ID,
		DeviceName:     device.Hostname,
		DetectedAt:     time.Now(),
		Diff:           diff,
		GoldenConfigID: goldenBackup.ID,
	}

	// 5. Alert (Create NetworkAlert)
	alert := models.NetworkAlert{
		DeviceID: &device.ID,
		Type:     "config_drift",
		Severity: "warning",
		Message:  fmt.Sprintf("Configuration drift detected on %s", device.Hostname),
	}
	cm.db.Create(&alert)

	return drift, nil
}

// ConfigsMatch performs a content comparison ignoring whitespace/newlines differences
func ConfigsMatch(conf1, conf2 string) bool {
	// Simple comparison for now, can be improved with tokenization
	return strings.TrimSpace(conf1) == strings.TrimSpace(conf2)
}

// GenerateUnifiedDiff creates a simple diff string
func GenerateUnifiedDiff(original, current string) string {
	// This is a placeholder for a real diff algorithm (e.g. using 'github.com/sergi/go-diff/diffmatchpatch')
	// Implementing a full diff in raw Go without deps is verbose.
	// We'll do a primitive line-by-line check.

	origLines := strings.Split(original, "\n")
	currLines := strings.Split(current, "\n")

	var sb strings.Builder
	sb.WriteString("--- Golden Config\n+++ Running Config\n")

	i, j := 0, 0
	for i < len(origLines) || j < len(currLines) {
		if i < len(origLines) && j < len(currLines) && origLines[i] == currLines[j] {
			i++
			j++
		} else {
			if i < len(origLines) {
				sb.WriteString(fmt.Sprintf("- %s\n", origLines[i]))
				i++
			}
			if j < len(currLines) {
				sb.WriteString(fmt.Sprintf("+ %s\n", currLines[j]))
				j++
			}
		}
	}
	return sb.String()
}
