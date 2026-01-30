package topology

import (
	"encoding/json"
	"fmt"
	"math"
	"strings"
	"time"

	"networking-main/internal/models"

	"gorm.io/gorm"
)

// AdvancedTopologyAnalyzer provides deep topology analysis
type AdvancedTopologyAnalyzer struct {
	db       *gorm.DB
	Physarum *PhysarumRouter
}

// TopologyAnalysis represents comprehensive topology analysis results
type TopologyAnalysis struct {
	ID                  uint      `json:"id" gorm:"primaryKey"`
	Timestamp           time.Time `json:"timestamp"`
	TotalDevices        int       `json:"total_devices"`
	TotalLinks          int       `json:"total_links"`
	NetworkDiameter     int       `json:"network_diameter"`
	AverageHopCount     float64   `json:"average_hop_count"`
	RedundancyScore     float64   `json:"redundancy_score"`
	SinglePointsFailure string    `json:"single_points_failure" gorm:"type:jsonb"`
	CriticalPaths       string    `json:"critical_paths" gorm:"type:jsonb"`
	BottleneckLinks     string    `json:"bottleneck_links" gorm:"type:jsonb"`
	NetworkSegments     string    `json:"network_segments" gorm:"type:jsonb"`
	RecommendedChanges  string    `json:"recommended_changes" gorm:"type:jsonb"`
	HealthScore         float64   `json:"health_score"`
}

// TopologyNode represents a node in the topology graph
type TopologyNode struct {
	ID          uint                   `json:"id"`
	Hostname    string                 `json:"hostname"`
	IPAddress   string                 `json:"ip_address"`
	DeviceType  string                 `json:"device_type"`
	Role        string                 `json:"role"` // core, distribution, access, edge
	Connections int                    `json:"connections"`
	Criticality string                 `json:"criticality"` // critical, high, medium, low
	Redundant   bool                   `json:"redundant"`
	Coordinates map[string]float64     `json:"coordinates"` // x, y for visualization
	Metrics     map[string]interface{} `json:"metrics"`
}

// TopologyPath represents a path between two nodes
type TopologyPath struct {
	Source      uint    `json:"source"`
	Destination uint    `json:"destination"`
	Hops        []uint  `json:"hops"`
	HopCount    int     `json:"hop_count"`
	Latency     float64 `json:"latency"`
	Bandwidth   float64 `json:"bandwidth"`
	Redundant   bool    `json:"redundant"`
}

// NetworkSegment represents a logical network segment
type NetworkSegment struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Type         string `json:"type"` // vlan, subnet, zone
	Devices      []uint `json:"devices"`
	Isolated     bool   `json:"isolated"`
	SecurityZone string `json:"security_zone"`
}

// SinglePointOfFailure represents a critical single point
type SinglePointOfFailure struct {
	DeviceID        uint    `json:"device_id"`
	DeviceName      string  `json:"device_name"`
	ImpactedDevices []uint  `json:"impacted_devices"`
	ImpactScore     float64 `json:"impact_score"`
	Mitigation      string  `json:"mitigation"`
}

// NewAdvancedTopologyAnalyzer creates a new topology analyzer
func NewAdvancedTopologyAnalyzer(db *gorm.DB) *AdvancedTopologyAnalyzer {
	ata := &AdvancedTopologyAnalyzer{
		db:       db,
		Physarum: NewPhysarumRouter(),
	}
	db.AutoMigrate(&TopologyAnalysis{})
	return ata
}

// PerformComprehensiveAnalysis performs full topology analysis
func (ata *AdvancedTopologyAnalyzer) PerformComprehensiveAnalysis() (*TopologyAnalysis, error) {
	analysis := &TopologyAnalysis{
		Timestamp: time.Now(),
	}

	// Get all devices and links
	nodes, links := ata.buildTopologyGraph()

	analysis.TotalDevices = len(nodes)
	analysis.TotalLinks = len(links)

	// Calculate network diameter (longest shortest path)
	analysis.NetworkDiameter = ata.calculateNetworkDiameter(nodes, links)

	// Calculate average hop count
	analysis.AverageHopCount = ata.calculateAverageHopCount(links)

	// Analyze redundancy
	analysis.RedundancyScore = ata.calculateRedundancyScore(nodes, links)

	// Find single points of failure
	spofs := ata.findSinglePointsOfFailure(nodes, links)
	spofsJSON, _ := json.Marshal(spofs)
	analysis.SinglePointsFailure = string(spofsJSON)

	// Identify critical paths
	criticalPaths := ata.identifyCriticalPaths(links)
	pathsJSON, _ := json.Marshal(criticalPaths)
	analysis.CriticalPaths = string(pathsJSON)

	// Find bottleneck links
	bottlenecks := ata.findBottleneckLinks(links)
	bottlenecksJSON, _ := json.Marshal(bottlenecks)
	analysis.BottleneckLinks = string(bottlenecksJSON)

	// Segment network
	segments := ata.segmentNetwork(nodes)
	segmentsJSON, _ := json.Marshal(segments)
	analysis.NetworkSegments = string(segmentsJSON)

	// Generate recommendations
	recommendations := ata.generateRecommendations(spofs, bottlenecks, segments)
	recsJSON, _ := json.Marshal(recommendations)
	analysis.RecommendedChanges = string(recsJSON)

	// Calculate overall health score
	analysis.HealthScore = ata.calculateTopologyHealthScore(analysis)

	// Save analysis
	if err := ata.db.Create(analysis).Error; err != nil {
		return nil, err
	}

	return analysis, nil
}

// buildTopologyGraph builds the network graph from database
func (ata *AdvancedTopologyAnalyzer) buildTopologyGraph() ([]TopologyNode, []TopologyPath) {
	var nodes []TopologyNode
	var links []TopologyPath

	// Query devices
	var devices []struct {
		ID         uint
		Hostname   string
		IPAddress  string
		DeviceType string
	}
	ata.db.Raw("SELECT id, hostname, ip_address, device_type FROM devices WHERE status = 'active'").Scan(&devices)

	// Build nodes
	for _, device := range devices {
		node := TopologyNode{
			ID:          device.ID,
			Hostname:    device.Hostname,
			IPAddress:   device.IPAddress,
			DeviceType:  device.DeviceType,
			Role:        ata.determineDeviceRole(device.DeviceType),
			Metrics:     make(map[string]interface{}),
			Coordinates: map[string]float64{"x": 0, "y": 0},
		}
		nodes = append(nodes, node)
	}

	// Query links from network_links table
	var networkLinks []models.NetworkLink
	ata.db.Where("status = ?", "up").Find(&networkLinks)

	for _, nl := range networkLinks {
		link := TopologyPath{
			Source:      nl.SourceDeviceID,
			Destination: nl.DestDeviceID,
			HopCount:    1,
			Latency:     1.0, // Default latency
			Bandwidth:   float64(nl.Bandwidth),
			Redundant:   false, // Calculated later
		}
		links = append(links, link)
	}

	return nodes, links
}

// calculateNetworkDiameter calculates the network diameter
func (ata *AdvancedTopologyAnalyzer) calculateNetworkDiameter(nodes []TopologyNode, links []TopologyPath) int {
	// Use Floyd-Warshall algorithm to find all-pairs shortest paths
	n := len(nodes)
	if n == 0 {
		return 0
	}

	// Initialize distance matrix
	dist := make([][]int, n)
	for i := range dist {
		dist[i] = make([]int, n)
		for j := range dist[i] {
			if i == j {
				dist[i][j] = 0
			} else {
				dist[i][j] = 9999 // Infinity
			}
		}
	}

	// Set distances for direct links
	for _, link := range links {
		i := ata.findNodeIndex(nodes, link.Source)
		j := ata.findNodeIndex(nodes, link.Destination)
		if i >= 0 && j >= 0 {
			dist[i][j] = 1
			dist[j][i] = 1
		}
	}

	// Floyd-Warshall
	for k := 0; k < n; k++ {
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				if dist[i][k]+dist[k][j] < dist[i][j] {
					dist[i][j] = dist[i][k] + dist[k][j]
				}
			}
		}
	}

	// Find maximum distance (diameter)
	diameter := 0
	for i := 0; i < n; i++ {
		for j := 0; j < n; j++ {
			if dist[i][j] < 9999 && dist[i][j] > diameter {
				diameter = dist[i][j]
			}
		}
	}

	return diameter
}

// calculateAverageHopCount calculates average hop count
func (ata *AdvancedTopologyAnalyzer) calculateAverageHopCount(links []TopologyPath) float64 {
	if len(links) == 0 {
		return 0
	}

	totalHops := 0
	for _, link := range links {
		totalHops += link.HopCount
	}

	return float64(totalHops) / float64(len(links))
}

// calculateRedundancyScore calculates network redundancy score
func (ata *AdvancedTopologyAnalyzer) calculateRedundancyScore(nodes []TopologyNode, links []TopologyPath) float64 {
	if len(nodes) == 0 {
		return 0
	}

	// Calculate average connectivity
	connectionCount := make(map[uint]int)
	for _, link := range links {
		connectionCount[link.Source]++
		connectionCount[link.Destination]++
	}

	totalConnections := 0
	redundantNodes := 0
	for _, count := range connectionCount {
		totalConnections += count
		if count > 1 {
			redundantNodes++
		}
	}

	redundancyScore := (float64(redundantNodes) / float64(len(nodes))) * 100
	return redundancyScore
}

// findSinglePointsOfFailure identifies SPOFs
func (ata *AdvancedTopologyAnalyzer) findSinglePointsOfFailure(nodes []TopologyNode, links []TopologyPath) []SinglePointOfFailure {
	var spofs []SinglePointOfFailure

	for _, node := range nodes {
		// Check if removing this node disconnects the network
		impactedDevices := ata.simulateNodeFailure(node.ID, nodes, links)

		if len(impactedDevices) > 0 {
			spof := SinglePointOfFailure{
				DeviceID:        node.ID,
				DeviceName:      node.Hostname,
				ImpactedDevices: impactedDevices,
				ImpactScore:     float64(len(impactedDevices)) / float64(len(nodes)) * 100,
				Mitigation:      ata.suggestMitigation(node),
			}
			spofs = append(spofs, spof)
		}
	}

	return spofs
}

// simulateNodeFailure simulates removing a node
func (ata *AdvancedTopologyAnalyzer) simulateNodeFailure(nodeID uint, nodes []TopologyNode, links []TopologyPath) []uint {
	// Remove node and its links
	activeLinks := []TopologyPath{}
	for _, link := range links {
		if link.Source != nodeID && link.Destination != nodeID {
			activeLinks = append(activeLinks, link)
		}
	}

	// Check connectivity
	connected := make(map[uint]bool)
	if len(nodes) > 0 {
		ata.dfs(nodes[0].ID, activeLinks, connected, nodeID)
	}

	// Find disconnected nodes
	var impacted []uint
	for _, node := range nodes {
		if node.ID != nodeID && !connected[node.ID] {
			impacted = append(impacted, node.ID)
		}
	}

	return impacted
}

// dfs performs depth-first search
func (ata *AdvancedTopologyAnalyzer) dfs(nodeID uint, links []TopologyPath, visited map[uint]bool, exclude uint) {
	if nodeID == exclude {
		return
	}
	visited[nodeID] = true

	for _, link := range links {
		if link.Source == nodeID && !visited[link.Destination] {
			ata.dfs(link.Destination, links, visited, exclude)
		} else if link.Destination == nodeID && !visited[link.Source] {
			ata.dfs(link.Source, links, visited, exclude)
		}
	}
}

// identifyCriticalPaths identifies critical network paths
func (ata *AdvancedTopologyAnalyzer) identifyCriticalPaths(links []TopologyPath) []TopologyPath {
	var critical []TopologyPath

	// Identify paths with high traffic or low redundancy
	for _, link := range links {
		// Check if this is the only path between segments
		if ata.isOnlyPath(link, links) {
			link.Redundant = false
			critical = append(critical, link)
		}
	}

	return critical
}

// isOnlyPath checks if a link is the only path
func (ata *AdvancedTopologyAnalyzer) isOnlyPath(link TopologyPath, allLinks []TopologyPath) bool {
	// Simple check - in production, use more sophisticated algorithm
	alternativePaths := 0
	for _, l := range allLinks {
		if (l.Source == link.Source && l.Destination == link.Destination) ||
			(l.Source == link.Destination && l.Destination == link.Source) {
			alternativePaths++
		}
	}
	return alternativePaths <= 1
}

// findBottleneckLinks finds network bottlenecks
func (ata *AdvancedTopologyAnalyzer) findBottleneckLinks(links []TopologyPath) []TopologyPath {
	var bottlenecks []TopologyPath

	for _, link := range links {
		// Check bandwidth utilization
		if link.Bandwidth < 100 { // Less than 100 Mbps
			bottlenecks = append(bottlenecks, link)
		}
	}

	return bottlenecks
}

// segmentNetwork divides network into logical segments
func (ata *AdvancedTopologyAnalyzer) segmentNetwork(nodes []TopologyNode) []NetworkSegment {
	var segments []NetworkSegment

	// Group by device role
	roleGroups := make(map[string][]uint)
	for _, node := range nodes {
		roleGroups[node.Role] = append(roleGroups[node.Role], node.ID)
	}

	segmentID := 1
	for role, devices := range roleGroups {
		segment := NetworkSegment{
			ID:           segmentID,
			Name:         fmt.Sprintf("%s-segment", role),
			Type:         "role-based",
			Devices:      devices,
			SecurityZone: ata.determineSecurityZone(role),
		}
		segments = append(segments, segment)
		segmentID++
	}

	return segments
}

// generateRecommendations generates topology improvement recommendations
func (ata *AdvancedTopologyAnalyzer) generateRecommendations(spofs []SinglePointOfFailure, bottlenecks []TopologyPath, segments []NetworkSegment) []string {
	var recommendations []string

	if len(spofs) > 0 {
		recommendations = append(recommendations, fmt.Sprintf("Found %d single points of failure - add redundant paths", len(spofs)))
	}

	if len(bottlenecks) > 0 {
		recommendations = append(recommendations, fmt.Sprintf("Found %d bottleneck links - upgrade bandwidth or add parallel links", len(bottlenecks)))
	}

	if len(segments) < 3 {
		recommendations = append(recommendations, "Consider segmenting network into more logical zones for better security")
	}

	return recommendations
}

// calculateTopologyHealthScore calculates overall topology health
func (ata *AdvancedTopologyAnalyzer) calculateTopologyHealthScore(analysis *TopologyAnalysis) float64 {
	score := 100.0

	// Penalize for SPOFs
	var spofs []SinglePointOfFailure
	json.Unmarshal([]byte(analysis.SinglePointsFailure), &spofs)
	score -= float64(len(spofs)) * 10

	// Penalize for low redundancy
	if analysis.RedundancyScore < 50 {
		score -= 20
	}

	// Penalize for bottlenecks
	var bottlenecks []TopologyPath
	json.Unmarshal([]byte(analysis.BottleneckLinks), &bottlenecks)
	score -= float64(len(bottlenecks)) * 5

	return math.Max(score, 0)
}

// Helper functions

func (ata *AdvancedTopologyAnalyzer) findNodeIndex(nodes []TopologyNode, id uint) int {
	for i, node := range nodes {
		if node.ID == id {
			return i
		}
	}
	return -1
}

func (ata *AdvancedTopologyAnalyzer) determineDeviceRole(deviceType string) string {
	deviceType = strings.ToLower(deviceType)
	if strings.Contains(deviceType, "core") {
		return "core"
	} else if strings.Contains(deviceType, "distribution") {
		return "distribution"
	} else if strings.Contains(deviceType, "access") || strings.Contains(deviceType, "switch") {
		return "access"
	} else if strings.Contains(deviceType, "router") {
		return "edge"
	}
	return "unknown"
}

func (ata *AdvancedTopologyAnalyzer) determineSecurityZone(role string) string {
	switch role {
	case "core":
		return "trusted"
	case "distribution":
		return "internal"
	case "access":
		return "user"
	case "edge":
		return "dmz"
	default:
		return "untrusted"
	}
}

func (ata *AdvancedTopologyAnalyzer) suggestMitigation(node TopologyNode) string {
	return fmt.Sprintf("Add redundant %s device or create alternate path", node.Role)
}

// GetLatestAnalysis retrieves the most recent topology analysis
func (ata *AdvancedTopologyAnalyzer) GetLatestAnalysis() (*TopologyAnalysis, error) {
	var analysis TopologyAnalysis
	err := ata.db.Order("timestamp DESC").First(&analysis).Error
	return &analysis, err
}

// ExportTopologyData exports topology for visualization
func (ata *AdvancedTopologyAnalyzer) ExportTopologyData() (map[string]interface{}, error) {
	nodes, links := ata.buildTopologyGraph()

	// Fallback to mock data if DB is empty (for demo/testing)
	if len(nodes) == 0 {
		nodes = []TopologyNode{
			{ID: 1, Hostname: "Core-Router-01", DeviceType: "core", Role: "core", Coordinates: map[string]float64{"x": 500, "y": 200}, Metrics: map[string]interface{}{"status": "up"}},
			{ID: 2, Hostname: "Dist-Switch-A", DeviceType: "distribution", Role: "distribution", Coordinates: map[string]float64{"x": 300, "y": 400}, Metrics: map[string]interface{}{"status": "up"}},
			{ID: 3, Hostname: "Dist-Switch-B", DeviceType: "distribution", Role: "distribution", Coordinates: map[string]float64{"x": 700, "y": 400}, Metrics: map[string]interface{}{"status": "warning"}},
			{ID: 4, Hostname: "Access-SW-01", DeviceType: "access", Role: "access", Coordinates: map[string]float64{"x": 200, "y": 600}, Metrics: map[string]interface{}{"status": "up"}},
			{ID: 5, Hostname: "Access-SW-02", DeviceType: "access", Role: "access", Coordinates: map[string]float64{"x": 400, "y": 600}, Metrics: map[string]interface{}{"status": "up"}},
			{ID: 6, Hostname: "Edge-Firewall", DeviceType: "router", Role: "edge", Coordinates: map[string]float64{"x": 500, "y": 100}, Metrics: map[string]interface{}{"status": "up"}},
			{ID: 7, Hostname: "Server-Farm", DeviceType: "server", Role: "server", Coordinates: map[string]float64{"x": 800, "y": 600}, Metrics: map[string]interface{}{"status": "up"}},
		}
		links = []TopologyPath{
			{Source: 6, Destination: 1, Bandwidth: 10000},
			{Source: 1, Destination: 2, Bandwidth: 10000},
			{Source: 1, Destination: 3, Bandwidth: 10000},
			{Source: 2, Destination: 4, Bandwidth: 1000},
			{Source: 2, Destination: 5, Bandwidth: 1000},
			{Source: 3, Destination: 7, Bandwidth: 10000},
			{Source: 4, Destination: 5, Bandwidth: 1000, Redundant: true},
		}
	} else {
		// Apply force-directed layout for visualization if real data
		ata.applyForceDirectedLayout(nodes)
	}

	return map[string]interface{}{
		"nodes": nodes,
		"links": links,
	}, nil
}

// applyForceDirectedLayout calculates node positions
func (ata *AdvancedTopologyAnalyzer) applyForceDirectedLayout(nodes []TopologyNode) {
	// Simple circular layout - in production, use proper force-directed algorithm
	n := len(nodes)
	for i := range nodes {
		angle := 2 * math.Pi * float64(i) / float64(n)
		nodes[i].Coordinates["x"] = 500 + 300*math.Cos(angle)
		nodes[i].Coordinates["y"] = 500 + 300*math.Sin(angle)
	}
}

// PerformBiologicalPathfinding uses slime mold logic to find resilient paths
func (ata *AdvancedTopologyAnalyzer) PerformBiologicalPathfinding(sourceID, sinkID uint) ([]*PhysarumEdge, error) {
	_, links := ata.buildTopologyGraph()

	// 1. Initialize the Physarum environment
	for _, link := range links {
		ata.Physarum.AddLink(link.Source, link.Destination, link.Latency)
	}

	// 2. Perform evolutionary iterations
	for i := 0; i < 50; i++ {
		ata.Physarum.Evolve(sourceID, sinkID)
	}

	// 3. Extract the resilient mesh
	return ata.Physarum.GetResilientPath(), nil
}
