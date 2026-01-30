package tests

import (
	"fmt"
	"math/rand"
	"networking-main/pkg/aiops"
	"networking-main/pkg/neural"
	"networking-main/pkg/topology"
	"testing"
)

func TestAlienAlgorithms(t *testing.T) {
	// 1. Test HDC
	t.Run("Hyperdimensional Computing", func(t *testing.T) {
		hdc := neural.NewHDCEngine()
		v1 := hdc.GenerateRandomVector()
		v2 := hdc.GenerateRandomVector()

		distSelf := hdc.HammingDistance(v1, v1)
		distOther := hdc.HammingDistance(v1, v2)

		fmt.Printf("HDC Self-Similarity: %.4f\n", distSelf)
		fmt.Printf("HDC Cross-Similarity: %.4f\n", distOther)

		if distSelf != 1.0 {
			t.Errorf("Self distance should be 1.0, got %f", distSelf)
		}
		if distOther > 0.6 || distOther < 0.4 {
			t.Logf("Warning: Random vectors might have unusual correlation: %f", distOther)
		}
	})

	// 2. Test Reservoir
	t.Run("Flux Reservoir", func(t *testing.T) {
		res := aiops.NewFluxReservoir(10)
		for i := 0; i < 100; i++ {
			val := 0.5 + 0.5*float64(i%10)/10.0
			res.Tick(val)
			res.Train(val)
		}
		forecast := res.Forecast(5)
		fmt.Printf("Flux Forecast: %v\n", forecast)
		if len(forecast) != 5 {
			t.Errorf("Expected 5 steps, got %d", len(forecast))
		}
	})

	// 3. Test Physarum
	t.Run("Physarum Routing", func(t *testing.T) {
		router := topology.NewPhysarumRouter()
		router.AddLink(1, 2, 10.0)
		router.AddLink(2, 3, 10.0)
		router.AddLink(1, 3, 50.0) // Sub-optimal path

		for i := 0; i < 10; i++ {
			router.Evolve(1, 3)
		}

		resilient := router.GetResilientPath()
		fmt.Printf("Resilient Paths Found: %d\n", len(resilient))
	})

	// 4. Test Bandit
	t.Run("Remediation Bandit", func(t *testing.T) {
		bandit := aiops.NewRemediationBandit()
		candidates := []string{"fix_A", "fix_B"}

		// Simulate fix_A being better
		for i := 0; i < 10; i++ {
			action := bandit.SelectAction("test_alert", candidates)
			if action == "fix_A" {
				bandit.UpdateReward(action, true)
			} else {
				bandit.UpdateReward(action, rand.Float64() > 0.8) // fix_B fails more
			}
		}

		best := bandit.SelectAction("test_alert", candidates)
		fmt.Printf("Bandit Best Action: %s\n", best)
	})
}
