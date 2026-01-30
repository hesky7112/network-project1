package models

import (
	"time"

	"gorm.io/gorm"
)

// SDWANSite represents a branch location
type SDWANSite struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	SiteName  string         `json:"name"`
	Location  string         `json:"location"`
	WANIP     string         `json:"wan_ip"`
	LANSubnet string         `json:"lan_subnet"`
	Status    string         `json:"status"` // "provisioned", "offline", "online"
	LastSeen  time.Time      `json:"last_seen"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// SDWANOverlayConfig represents a tunnel configuration
type SDWANOverlayConfig struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	SiteID     uint           `json:"site_id"`
	Type       string         `json:"type"` // "wireguard", "ipsec"
	PublicKey  string         `json:"public_key"`
	PrivateKey string         `json:"private_key,omitempty"` // Only sent once
	Endpoint   string         `json:"endpoint"`
	AllowedIPs string         `json:"allowed_ips"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}
