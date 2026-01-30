package topology

import (
	"math"
)

// PhysarumNode represents a node with biological "nutrient" level
type PhysarumNode struct {
	ID       uint
	Pressure float64
}

// PhysarumEdge represents a network link behaving like a slime mold tube
type PhysarumEdge struct {
	Source       uint
	Destination  uint
	Length       float64 // Latency
	Conductivity float64 // Capacity/Thickness
	Flux         float64 // Current Traffic
}

// PhysarumRouter evolves topology based on slime mold intelligence
type PhysarumRouter struct {
	Nodes map[uint]*PhysarumNode
	Edges []*PhysarumEdge
	Alpha float64 // Adaptation rate
}

func NewPhysarumRouter() *PhysarumRouter {
	return &PhysarumRouter{
		Nodes: make(map[uint]*PhysarumNode),
		Edges: make([]*PhysarumEdge, 0),
		Alpha: 0.1,
	}
}

// AddLink adds a new "tube" between nodes
func (pr *PhysarumRouter) AddLink(s, d uint, latency float64) {
	pr.Edges = append(pr.Edges, &PhysarumEdge{
		Source:       s,
		Destination:  d,
		Length:       math.Max(latency, 0.1),
		Conductivity: 1.0, // Initial thickness
	})
	if _, ok := pr.Nodes[s]; !ok {
		pr.Nodes[s] = &PhysarumNode{ID: s}
	}
	if _, ok := pr.Nodes[d]; !ok {
		pr.Nodes[d] = &PhysarumNode{ID: d}
	}
}

// Evolve performs one iteration of the Physarum adaptation
func (pr *PhysarumRouter) Evolve(source, sink uint) {
	// 1. Calculate pressures (Simulate flow)
	// Simplified Poiseuille-style flow calculation
	// In a full implementation, we'd solve a linear system for all nodes
	pr.Nodes[source].Pressure = 100.0
	pr.Nodes[sink].Pressure = 0.0

	// 2. Update Flux and Conductivity
	for _, edge := range pr.Edges {
		pSource := pr.Nodes[edge.Source].Pressure
		pDest := pr.Nodes[edge.Destination].Pressure

		// Flux = Conductivity * (dp / Length)
		edge.Flux = (edge.Conductivity * (pSource - pDest)) / edge.Length

		// Conductivity Adaptation: dD/dt = |Flux| - D
		// If flux is high, the "tube" thickens; if low, it withers.
		growth := math.Abs(edge.Flux)
		edge.Conductivity = edge.Conductivity + pr.Alpha*(growth-edge.Conductivity)

		// Ensure minimum viability
		if edge.Conductivity < 0.01 {
			edge.Conductivity = 0.01
		}
	}
}

// GetResilientPath returns edges with high biological viability
func (pr *PhysarumRouter) GetResilientPath() []*PhysarumEdge {
	threshold := 0.5
	resilient := make([]*PhysarumEdge, 0)
	for _, e := range pr.Edges {
		if e.Conductivity > threshold {
			resilient = append(resilient, e)
		}
	}
	return resilient
}
