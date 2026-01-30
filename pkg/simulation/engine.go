package simulation

import (
	"fmt"
	"math/rand"
	"networking-main/internal/models"
	"sync"

	"gorm.io/gorm"
)

// NodeType enum
const (
	NodeTypeRouter = "router"
	NodeTypeSwitch = "switch"
	NodeTypePC     = "pc"
)

// Re-using models from internal/models for persistence
type VirtualNode = models.VirtualNode
type VirtualLink = models.VirtualLink

// SimulationEngine manages the virtual network state
type SimulationEngine struct {
	db *gorm.DB
	mu sync.RWMutex // Still useful for in-memory sync if needed, but mostly using DB now
}

// NewEngine creates a new simulation environment
func NewEngine(db *gorm.DB) *SimulationEngine {
	return &SimulationEngine{
		db: db,
	}
}

// AddNode adds a device to the simulation (defaulting to scenario 1 for now)
func (se *SimulationEngine) AddNode(nodeID, name, nodeType string) {
	node := models.VirtualNode{
		ScenarioID: 1,
		NodeID:     nodeID,
		Name:       name,
		Type:       nodeType,
		Status:     "up",
	}
	se.db.Where("node_id = ? AND scenario_id = ?", nodeID, 1).FirstOrCreate(&node)
}

// AddLink connects two nodes
func (se *SimulationEngine) AddLink(linkID, src, dst string, latency float64) {
	link := models.VirtualLink{
		ScenarioID: 1,
		SourceID:   src,
		TargetID:   dst,
		LatencyMs:  latency,
		Status:     "up",
	}
	// Note: VirtualLink model doesn't have a LogicID/LinkID string field, using standard GORM ID
	// If we need to track by linkID string, we should add it to the model.
	// For now we'll just create it.
	se.db.Create(&link)
}

// InjectFailure simulates a link cut or node failure
func (se *SimulationEngine) InjectFailure(targetID, failureType string) error {
	if failureType == "down" {
		return se.db.Model(&models.VirtualNode{}).Where("node_id = ? AND scenario_id = ?", targetID, 1).Update("status", "down").Error
	}
	// For links, we might need a better way to target them if we don't have LinkID strings
	return se.db.Model(&models.VirtualLink{}).Where("(source_id = ? OR target_id = ?) AND scenario_id = ?", targetID, targetID, 1).Update("status", "cut").Error
}

// Restore recovers a failed component
func (se *SimulationEngine) Restore(targetID string) error {
	se.db.Model(&models.VirtualNode{}).Where("node_id = ? AND scenario_id = ?", targetID, 1).Update("status", "up")
	se.db.Model(&models.VirtualLink{}).Where("(source_id = ? OR target_id = ?) AND scenario_id = ?", targetID, targetID, 1).Update("status", "up")
	return nil
}

// PingResult contains simulation metrics
type PingResult struct {
	Success    bool     `json:"success"`
	TimeMs     float64  `json:"time_ms"`
	PathTaken  []string `json:"path_taken"`
	PacketLoss float64  `json:"packet_loss"`
	Error      string   `json:"error"`
}

// SimulatePing attempts to find a path and calculate latency
func (se *SimulationEngine) SimulatePing(srcID, dstID string) PingResult {
	// 1. Basic BFS Pathfinding
	path, totalLatency, err := se.findPath(srcID, dstID)
	if err != nil {
		return PingResult{Success: false, Error: err.Error()}
	}

	// 2. Apply Jitter
	jitter := (rand.Float64() * 2.0) - 1.0 // +/- 1ms
	finalLatency := totalLatency + jitter
	if finalLatency < 0 {
		finalLatency = 0.5
	}

	return PingResult{
		Success:   true,
		TimeMs:    finalLatency,
		PathTaken: path,
	}
}

// Simple BFS to find path through active links
func (se *SimulationEngine) findPath(start, end string) ([]string, float64, error) {
	var startNode models.VirtualNode
	if err := se.db.Where("node_id = ? AND scenario_id = ?", start, 1).First(&startNode).Error; err != nil {
		return nil, 0, fmt.Errorf("source node %s not found", start)
	}
	if startNode.Status != "up" {
		return nil, 0, fmt.Errorf("source node %s is down", start)
	}

	var endNode models.VirtualNode
	if err := se.db.Where("node_id = ? AND scenario_id = ?", end, 1).First(&endNode).Error; err != nil {
		return nil, 0, fmt.Errorf("destination node %s not found", end)
	}
	if endNode.Status != "up" {
		return nil, 0, fmt.Errorf("destination node %s is down", end)
	}

	// Load all nodes and links for BFS
	var allNodes []models.VirtualNode
	se.db.Where("scenario_id = ?", 1).Find(&allNodes)
	nodeMap := make(map[string]models.VirtualNode)
	for _, n := range allNodes {
		nodeMap[n.NodeID] = n
	}

	var allLinks []models.VirtualLink
	se.db.Where("scenario_id = ?", 1).Find(&allLinks)

	queue := []string{start}
	visited := make(map[string]bool)
	parent := make(map[string]string)
	linkUsed := make(map[string]models.VirtualLink)

	visited[start] = true

	for len(queue) > 0 {
		curr := queue[0]
		queue = queue[1:]

		if curr == end {
			break
		}

		// Find neighbors
		for _, link := range allLinks {
			if link.Status != "up" {
				continue
			}

			var neighbor string
			if link.SourceID == curr {
				neighbor = link.TargetID
			} else if link.TargetID == curr {
				neighbor = link.SourceID
			} else {
				continue
			}

			if !visited[neighbor] && nodeMap[neighbor].Status == "up" {
				visited[neighbor] = true
				parent[neighbor] = curr
				linkUsed[neighbor] = link
				queue = append(queue, neighbor)
			}
		}
	}

	if !visited[end] {
		return nil, 0, fmt.Errorf("host unreachable")
	}

	// Reconstruct path
	var path []string
	var latency float64
	curr := end
	for curr != start {
		path = append([]string{curr}, path...)
		link := linkUsed[curr]
		latency += link.LatencyMs
		curr = parent[curr]
	}
	path = append([]string{start}, path...)

	return path, latency, nil
}
