package models

import (
	"time"

	"gorm.io/gorm"
)

// RemoteProbe represents a monitoring agent at a remote site
type RemoteProbe struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Name      string         `json:"name"`
	Location  string         `json:"location"`
	IPAddress string         `json:"ip_address"`
	SecretKey string         `json:"-"` // Used for auth from probe to server
	LastSeen  time.Time      `json:"last_seen"`
	Status    string         `json:"status"` // "online", "offline", "degraded"
	Version   string         `json:"version"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// ProbeResult stores latency/uptime data from a probe
type ProbeResult struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	ProbeID    uint      `json:"probe_id"`
	Target     string    `json:"target"` // The IP/URL being monitored
	LatencyMs  float64   `json:"latency_ms"`
	PacketLoss float64   `json:"packet_loss"`
	Status     string    `json:"status"` // "up", "down"
	CreatedAt  time.Time `json:"created_at"`
}

// WebhookConfig defines external notification targets
type WebhookConfig struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name"`
	URL       string    `json:"url"`
	Events    string    `json:"events"` // JSON array: ["payment.success", "device.down"]
	Secret    string    `json:"secret"` // Used to sign the payload
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
