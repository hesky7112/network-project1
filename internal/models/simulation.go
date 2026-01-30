package models

import (
	"time"

	"gorm.io/gorm"
)

// SimulationScenario represents a saved network topology
type SimulationScenario struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	CreatorID   uint           `json:"creator_id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	Nodes []VirtualNode `json:"nodes" gorm:"foreignKey:ScenarioID"`
	Links []VirtualLink `json:"links" gorm:"foreignKey:ScenarioID"`
}

// VirtualNode represents a device in the simulation
type VirtualNode struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	ScenarioID uint           `json:"scenario_id"`
	NodeID     string         `json:"node_id"` // logic ID like "router-1"
	Name       string         `json:"name"`
	Type       string         `json:"type"`
	Status     string         `json:"status"`
	Configs    string         `json:"configs" gorm:"type:text"` // JSON
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}

// VirtualLink represents a connection between nodes
type VirtualLink struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	ScenarioID uint           `json:"scenario_id"`
	SourceID   string         `json:"source_id"`
	TargetID   string         `json:"target_id"`
	LatencyMs  float64        `json:"latency_ms"`
	PacketLoss float64        `json:"packet_loss"`
	Status     string         `json:"status"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}
