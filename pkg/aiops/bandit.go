package aiops

import (
	"math"
	"math/rand"
	"time"
)

// RemediationArm represents a playbook option in the MAB
type RemediationArm struct {
	PlaybookID string
	PullCount  int     // Number of times used
	RewardSum  float64 // Total successful outcomes
}

// RemediationBandit evolves automated fixes through trial and error
type RemediationBandit struct {
	Arms       map[string]*RemediationArm // AlertType -> List of Arms
	TotalPulls int
	Random     *rand.Rand
}

func NewRemediationBandit() *RemediationBandit {
	return &RemediationBandit{
		Arms:   make(map[string]*RemediationArm),
		Random: rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// SelectAction uses UCB1 (Upper Confidence Bound) to choose the best fix
func (rb *RemediationBandit) SelectAction(alertType string, playbooks []string) string {
	var bestArm string
	maxUCB := -1.0

	for _, pbID := range playbooks {
		arm, ok := rb.Arms[pbID]
		if !ok {
			// Exploration: Try never-before-seen playbooks first
			return pbID
		}

		if arm.PullCount == 0 {
			return pbID
		}

		// UCB1 formula: AverageReward + sqrt(2 * ln(Total) / ArmPulls)
		avgReward := arm.RewardSum / float64(arm.PullCount)
		exploration := math.Sqrt(2 * math.Log(float64(rb.TotalPulls)) / float64(arm.PullCount))
		ucb := avgReward + exploration

		if ucb > maxUCB {
			maxUCB = ucb
			bestArm = pbID
		}
	}

	return bestArm
}

// UpdateReward logs the outcome of a remediation action
func (rb *RemediationBandit) UpdateReward(pbID string, success bool) {
	arm, ok := rb.Arms[pbID]
	if !ok {
		arm = &RemediationArm{PlaybookID: pbID}
		rb.Arms[pbID] = arm
	}

	arm.PullCount++
	rb.TotalPulls++
	if success {
		arm.RewardSum += 1.0
	} else {
		arm.RewardSum -= 0.5 // Penalize failed actions more than neutral
	}
}
