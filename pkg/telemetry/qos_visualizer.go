package telemetry

import (
	"gorm.io/gorm"
)

type QoSVisualizer struct {
	db *gorm.DB
}

type QueueStats struct {
	InterfaceName string  `json:"interface"`
	QueueName     string  `json:"queue_name"`
	ConfiguredBW  string  `json:"configured_bw"`
	CurrentDepth  int64   `json:"current_depth_packets"`
	Drops         int64   `json:"total_drops"`
	Utilization   float64 `json:"utilization_pct"`
}

func NewQoSVisualizer(db *gorm.DB) *QoSVisualizer {
	return &QoSVisualizer{db: db}
}

// GetInterfaceQueueStats returns QoS statistics for a device interface
func (qv *QoSVisualizer) GetInterfaceQueueStats(deviceID uint) ([]QueueStats, error) {
	var stats []QueueStats

	// In a real implementation, this would query the telemetry_data table
	// for specific QoS OIDs (like CISCO-CLASS-BASED-QOS-MIB)
	// For now, we'll return a structure based on what we would expect from DB

	// Example query logic:
	// Find latest telemetry for QoS metrics

	// Mocking empty return for now as we don't have the granular QoSOID collection yet
	// But structure is ready for integration

	return stats, nil
}
