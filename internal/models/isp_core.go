package models

import (
	"time"

	"gorm.io/gorm"
)

// IPPool represents a subnet or range of IP addresses
type IPPool struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name"`
	Subnet      string         `json:"subnet"` // e.g., 192.168.10.0/24
	Gateway     string         `json:"gateway"`
	StartIP     string         `json:"start_ip"`
	EndIP       string         `json:"end_ip"`
	Type        string         `json:"type"`         // "static", "dynamic", "pppoe"
	InterfaceID uint           `json:"interface_id"` // Link to a physical or VLAN interface
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// IPLease represents an assigned IP to a user/device
type IPLease struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	PoolID     uint           `json:"pool_id"`
	Pool       IPPool         `json:"pool" gorm:"foreignKey:PoolID"`
	UserID     uint           `json:"user_id"` // HotspotUserID
	IPAddress  string         `json:"ip_address" gorm:"uniqueIndex"`
	MACAddress string         `json:"mac_address"`
	Status     string         `json:"status"` // "active", "released", "expired"
	ExpiresAt  time.Time      `json:"expires_at"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// Invoice represents a billing document
type Invoice struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"user_id"`
	User      HotspotUser    `json:"user" gorm:"foreignKey:UserID"`
	Number    string         `json:"number" gorm:"uniqueIndex"` // INV-2024-001
	Amount    float64        `json:"amount"`
	Tax       float64        `json:"tax"`
	Total     float64        `json:"total"`
	Status    string         `json:"status"` // "unpaid", "paid", "overdue", "cancelled"
	DueDate   time.Time      `json:"due_date"`
	PaidAt    *time.Time     `json:"paid_at"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// FUPConfig represents Fair Usage Policy settings for a package
type FUPConfig struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	PackageID     uint           `json:"package_id" gorm:"uniqueIndex"`
	Package       PricingPackage `json:"package" gorm:"foreignKey:PackageID"`
	DailyLimit    int64          `json:"daily_limit"`    // In Bytes
	MonthlyLimit  int64          `json:"monthly_limit"`  // In Bytes
	ThrottledDown int            `json:"throttled_down"` // In Kbps
	ThrottledUp   int            `json:"throttled_up"`   // In Kbps
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// BoostSession represents a temporary bandwidth upgrade
type BoostSession struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"user_id" gorm:"index"`
	User      HotspotUser    `json:"user" gorm:"foreignKey:UserID"`
	PackageID uint           `json:"package_id"`
	Package   PricingPackage `json:"package" gorm:"foreignKey:PackageID"`
	Status    string         `json:"status"` // "active", "expired", "cancelled"
	ExpiresAt time.Time      `json:"expires_at"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// TaxConfig represents tax rates
type TaxConfig struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Name      string         `json:"name"` // e.g., VAT
	Rate      float64        `json:"rate"` // e.g., 16.0
	IsActive  bool           `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// BotConfig represents settings for an admin bot
type BotConfig struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	BotName   string         `json:"bot_name"`
	Platform  string         `json:"platform"` // "telegram", "whatsapp"
	Token     string         `json:"token"`
	IsActive  bool           `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
