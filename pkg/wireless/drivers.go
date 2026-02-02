package wireless

import (
	"networking-main/internal/models"
)

// APStats contains real-time statistics from an Access Point
type APStats struct {
	CPUUsage    int
	MemoryUsage int
	Temperature int
	Uptime      string
}

// WirelessDriver defines the interface for interacting with physical APs
type WirelessDriver interface {
	// Name returns the driver name (e.g., "mikrotik", "cisco")
	Name() string

	// ProvisionAP pushes configuration to the AP
	ProvisionAP(ap *models.AccessPoint) error

	// RebootAP restarts the AP
	RebootAP(ap *models.AccessPoint) error

	// GetStats retrieves real-time metrics
	GetStats(ap *models.AccessPoint) (*APStats, error)
}
