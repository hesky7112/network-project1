package models

import (
	"time"

	"gorm.io/gorm"
)

// NetworkLink represents a physical or logical connection between two devices
type NetworkLink struct {
	ID              uint           `json:"id" gorm:"primaryKey"`
	SourceDeviceID  uint           `json:"source_device_id" gorm:"index"`
	SourceInterface string         `json:"source_interface"`
	DestDeviceID    uint           `json:"dest_device_id" gorm:"index"`
	DestInterface   string         `json:"dest_interface"`
	LinkType        string         `json:"link_type"` // "cdp", "lldp", "manual", "ospf", "bgp"
	Bandwidth       int64          `json:"bandwidth"` // in Mbps
	Status          string         `json:"status"`    // "up", "down", "unknown"
	LastDiscovery   time.Time      `json:"last_discovery"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"deleted_at" gorm:"index"`

	// Relations
	SourceDevice Device `json:"source_device" gorm:"foreignKey:SourceDeviceID"`
	DestDevice   Device `json:"dest_device" gorm:"foreignKey:DestDeviceID"`
}
