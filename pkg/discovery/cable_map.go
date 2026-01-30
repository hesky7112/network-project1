package discovery

import (
	"fmt"
	"time"

	"networking-main/internal/models"

	"gorm.io/gorm"
)

type CableMapManager struct {
	db *gorm.DB
}

func NewCableMapManager(db *gorm.DB) *CableMapManager {
	return &CableMapManager{db: db}
}

type PhysicalLink struct {
	SourceDevice string    `json:"source_device"`
	SourcePort   string    `json:"source_port"`
	DestDevice   string    `json:"dest_device"`
	DestPort     string    `json:"dest_port"`
	LinkType     string    `json:"link_type"` // "fiber", "copper", "unknown"
	Speed        string    `json:"speed"`
	LastSeen     time.Time `json:"last_seen"`
}

// GetPhysicalTopology returns a list of all physical links
func (cm *CableMapManager) GetPhysicalTopology() ([]PhysicalLink, error) {
	var links []models.NetworkLink
	// Preload device info if needed, or join
	err := cm.db.Where("status = ?", "up").Find(&links).Error
	if err != nil {
		return nil, err
	}

	var physLinks []PhysicalLink

	// Cache device names
	deviceCache := make(map[uint]string)

	for _, link := range links {
		srcName := cm.getDeviceName(link.SourceDeviceID, deviceCache)
		destName := cm.getDeviceName(link.DestDeviceID, deviceCache)

		physLinks = append(physLinks, PhysicalLink{
			SourceDevice: srcName,
			SourcePort:   link.SourceInterface,
			DestDevice:   destName,
			DestPort:     link.DestInterface,
			LinkType:     "unknown", // To be enhanced with interface speed/media type
			Speed:        "unknown",
			LastSeen:     link.LastDiscovery,
		})
	}

	return physLinks, nil
}

func (cm *CableMapManager) getDeviceName(id uint, cache map[uint]string) string {
	if name, ok := cache[id]; ok {
		return name
	}

	var device models.Device
	if err := cm.db.First(&device, id).Error; err == nil {
		cache[id] = device.Hostname
		return device.Hostname
	}
	return fmt.Sprintf("Device-%d", id)
}
