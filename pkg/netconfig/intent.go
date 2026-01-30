package netconfig

import (
	"context"
	"fmt"
	"networking-main/internal/models"

	"gorm.io/gorm"
)

type IntentManager struct {
	db            *gorm.DB
	configManager *ConfigManager
}

type NetworkIntent struct {
	Type       string                 `json:"type"`       // "VoIP_QoS", "Secure_Access", "Guest_Isolation"
	Target     string                 `json:"target"`     // "All_Switches", "Branch_01"
	Parameters map[string]interface{} `json:"parameters"` // {"bandwidth": "10Mbps", "vlan": 20}
}

func NewIntentManager(db *gorm.DB, cm *ConfigManager) *IntentManager {
	return &IntentManager{db: db, configManager: cm}
}

// ApplyIntent translates an intent into device configurations
func (im *IntentManager) ApplyIntent(ctx context.Context, intent NetworkIntent) ([]string, error) {
	// 1. Identify Target Devices
	var devices []models.Device
	query := im.db.Model(&models.Device{})

	if intent.Target == "All_Switches" {
		query = query.Where("type = ?", "switch")
	} else {
		// Assume target is a hostname pattern or specific ID
		query = query.Where("hostname LIKE ?", fmt.Sprintf("%%%s%%", intent.Target))
	}

	if err := query.Find(&devices).Error; err != nil {
		return nil, err
	}

	var results []string

	// 2. Translate Intent to Commands
	for _, dev := range devices {
		cmds, err := im.translateIntent(intent, dev.DeviceType)
		if err != nil {
			results = append(results, fmt.Sprintf("❌ Failed to translate for %s: %v", dev.Hostname, err))
			continue
		}

		// 3. Push Config (Mocking execution)
		// err = im.configManager.PushCommands(dev, cmds)
		results = append(results, fmt.Sprintf("✅ Applied intent '%s' to %s (%d commands)", intent.Type, dev.Hostname, len(cmds)))
	}

	return results, nil
}

func (im *IntentManager) translateIntent(intent NetworkIntent, deviceType string) ([]string, error) {
	switch intent.Type {
	case "VoIP_QoS":
		if deviceType == "cisco" {
			return []string{
				"auto qos voip trust",
				"priority-queue out",
			}, nil
		}
	case "Guest_Isolation":
		vlan, ok := intent.Parameters["vlan"].(int)
		if !ok {
			vlan = 999 // Default
		}
		if deviceType == "cisco" {
			return []string{
				fmt.Sprintf("vlan %d", vlan),
				"name GUEST_WIFI",
				"private-vlan isolated",
			}, nil
		}
	}
	return nil, fmt.Errorf("unsupported intent type or device: %s / %s", intent.Type, deviceType)
}
