package models

import (
	"time"

	"gorm.io/gorm"
)

// PricingPackage represents a WiFi or Data plan
type PricingPackage struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	Name          string         `json:"name"`
	Type          string         `json:"type"` // "hotspot", "pppoe", "qos", "business", "enterprise"
	Description   string         `json:"description"`
	Features      string         `json:"features"`       // JSON string for specific QoS/Package features
	Price         float64        `json:"price"`          // In KES
	PriceLabel    string         `json:"price_label"`    // e.g., "Custom", "Starter", "Premium"
	Duration      int            `json:"duration"`       // In Minutes
	DataLimit     int64          `json:"data_limit"`     // In Bytes, 0 for unlimited
	DownloadSpeed int            `json:"download_speed"` // Kbps
	UploadSpeed   int            `json:"upload_speed"`   // Kbps
	SortOrder     int            `json:"sort_order"`
	IsActive      bool           `json:"is_active" gorm:"default:true"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// HotspotUser represents a WiFi user
type HotspotUser struct {
	ID              uint           `json:"id" gorm:"primaryKey"`
	PhoneNumber     string         `json:"phone_number" gorm:"index"`   // M-Pesa Number
	Username        string         `json:"username" gorm:"uniqueIndex"` // For PPPoE/Hotspot Login
	Password        string         `json:"-"`                           // Hashed password
	MACAddress      string         `json:"mac_address" gorm:"index"`
	IPAddress       string         `json:"ip_address"`
	CurrentBalance  float64        `json:"current_balance"`
	AccessExpiresAt time.Time      `json:"access_expires_at"`
	IsBlacklisted   bool           `json:"is_blacklisted" gorm:"default:false"`
	ServiceType     string         `json:"service_type"` // "hotspot", "pppoe"
	Notes           string         `json:"notes"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// Voucher represents a prepaid access code
type Voucher struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	Code           string         `json:"code" gorm:"uniqueIndex"`
	PackageID      uint           `json:"package_id"`
	PricingPackage PricingPackage `json:"package" gorm:"foreignKey:PackageID"`
	Status         string         `json:"status"`               // "active", "used", "expired"
	UsedBy         uint           `json:"used_by" gorm:"index"` // HotspotUserID
	UsedAt         time.Time      `json:"used_at"`
	ExpiresAt      time.Time      `json:"expires_at"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// Payment represents a transaction (M-Pesa)
type Payment struct {
	ID                uint           `json:"id" gorm:"primaryKey"`
	UserID            uint           `json:"user_id" gorm:"index"`
	HotspotUser       HotspotUser    `json:"user" gorm:"foreignKey:UserID"`
	PackageID         uint           `json:"package_id"`
	PricingPackage    PricingPackage `json:"package" gorm:"foreignKey:PackageID"`
	Amount            float64        `json:"amount"`
	Currency          string         `json:"currency" gorm:"default:'KES'"`
	Provider          string         `json:"provider" gorm:"default:'M-Pesa'"`
	TransactionRef    string         `json:"transaction_ref" gorm:"uniqueIndex"` // M-Pesa Receipt Number
	MerchantRequestID string         `json:"merchant_request_id" gorm:"index"`
	CheckoutRequestID string         `json:"checkout_request_id" gorm:"index"`
	Status            string         `json:"status"` // "pending", "completed", "failed"
	Message           string         `json:"message"`
	TransactionDate   time.Time      `json:"transaction_date"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// RadiusSession represents a RADIUS session
type RadiusSession struct {
	ID               uint      `json:"id" gorm:"primaryKey"`
	UserName         string    `json:"username" gorm:"index"` // Usually MAC
	NasIP            string    `json:"nas_ip"`
	FramedIP         string    `json:"framed_ip"`
	SessionID        string    `json:"session_id" gorm:"index"`
	StartTime        time.Time `json:"start_time"`
	StopTime         time.Time `json:"stop_time"`
	InputOctets      int64     `json:"input_octets"`
	OutputOctets     int64     `json:"output_octets"`
	TerminationCause string    `json:"termination_cause"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
