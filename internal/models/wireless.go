package models

import (
	"time"

	"gorm.io/gorm"
)

// AccessPoint represents a managed AP
type AccessPoint struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	Name             string         `json:"name"`
	MACAddress       string         `json:"mac_address" gorm:"uniqueIndex"`
	IPAddress        string         `json:"ip_address"`
	Status           string         `json:"status"` // "online", "offline", "provisioning"
	ConnectedClients int            `json:"connected_clients"`
	Model            string         `json:"model"`
	LastSeen         time.Time      `json:"last_seen"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`
}

// SSIDProfile represents a wireless network configuration
type SSIDProfile struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Name      string         `json:"name"`
	SSID      string         `json:"ssid"`
	Security  string         `json:"security"` // "wpa2", "wpa3", "open"
	VLAN      int            `json:"vlan"`
	IsGuest   bool           `json:"is_guest"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// WirelessClient represents a connected device
type WirelessClient struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	MACAddress string         `json:"mac_address" gorm:"uniqueIndex"`
	IPAddress  string         `json:"ip_address"`
	SSID       string         `json:"ssid"`
	APID       uint           `json:"ap_id"`
	Signal     int            `json:"signal_dbm"` // e.g. -65
	LastSeen   time.Time      `json:"last_seen"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}
