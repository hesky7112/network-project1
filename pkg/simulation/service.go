package simulation

import (
	"fmt"
	"networking-main/internal/models"

	"gorm.io/gorm"
)

// Service provides simulation capabilities
type Service struct {
	db     *gorm.DB
	engine *SimulationEngine
}

func NewService(db *gorm.DB) *Service {
	s := &Service{
		db:     db,
		engine: NewEngine(db),
	}
	s.initDemoTopology()
	return s
}

// initDemoTopology sets up a default scenario
func (s *Service) initDemoTopology() {
	// Create scenario 1 if not exists
	var scenario models.SimulationScenario
	s.db.FirstOrCreate(&scenario, models.SimulationScenario{ID: 1, Name: "Default Lab", Description: "Initial demo environment"})

	s.engine.AddNode("router-1", "Core Router", NodeTypeRouter)
	s.engine.AddNode("switch-1", "Dist Switch", NodeTypeSwitch)
	s.engine.AddNode("pc-1", "Admin PC", NodeTypePC)

	// Since AddLink uses Create, we might want to check if they exist or clear them
	// For demo, we'll just check if links exist for scenario 1
	var linkCount int64
	s.db.Model(&models.VirtualLink{}).Where("scenario_id = ?", 1).Count(&linkCount)
	if linkCount == 0 {
		s.engine.AddLink("link-1", "router-1", "switch-1", 2.5) // 2.5ms
		s.engine.AddLink("link-2", "switch-1", "pc-1", 0.5)     // 0.5ms
	}
}

func (s *Service) GetTopology() (map[string]models.VirtualNode, []models.VirtualLink, error) {
	var nodes []models.VirtualNode
	var links []models.VirtualLink

	if err := s.db.Where("scenario_id = ?", 1).Find(&nodes).Error; err != nil {
		return nil, nil, err
	}
	if err := s.db.Where("scenario_id = ?", 1).Find(&links).Error; err != nil {
		return nil, nil, err
	}

	nodeMap := make(map[string]models.VirtualNode)
	for _, n := range nodes {
		nodeMap[n.NodeID] = n
	}

	return nodeMap, links, nil
}

func (s *Service) InjectFailure(targetID, failureType string) error {
	return s.engine.InjectFailure(targetID, failureType)
}

func (s *Service) Restore(targetID string) error {
	return s.engine.Restore(targetID)
}

func (s *Service) RunPing(src, dst string) (PingResult, error) {
	fmt.Printf("[Simulation] Pinging from %s to %s\n", src, dst)
	return s.engine.SimulatePing(src, dst), nil
}
