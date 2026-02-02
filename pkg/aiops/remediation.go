package aiops

import (
	"context"
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"

	"networking-main/internal/models"
	"networking-main/pkg/netconfig"
	"networking-main/pkg/neural"

	"gorm.io/gorm"
)

type RemediationEngine struct {
	db            *gorm.DB
	configService *netconfig.Service
	neuralService *neural.Service
	bandit        *RemediationBandit
}

func NewRemediationEngine(db *gorm.DB, configService *netconfig.Service, neuralService *neural.Service) *RemediationEngine {
	return &RemediationEngine{
		db:            db,
		configService: configService,
		neuralService: neuralService,
		bandit:        NewRemediationBandit(),
	}
}

func (re *RemediationEngine) SetConfigService(cs *netconfig.Service) {
	re.configService = cs
}

func (re *RemediationEngine) SetNeuralService(ns *neural.Service) {
	re.neuralService = ns
}

// Playbook represents a remediation action
type Playbook struct {
	Name        string
	Description string
	Action      func(ctx context.Context, device models.Device, alert models.NetworkAlert) error
}

// RemediationResult tracks the outcome of a fix
type RemediationResult struct {
	AlertID   uint      `json:"alert_id"`
	Action    string    `json:"action"`
	Success   bool      `json:"success"`
	Output    string    `json:"output"`
	Timestamp time.Time `json:"timestamp"`
}

// EvaluateAlert checks if an alert matches a known playbook and executes it
func (re *RemediationEngine) EvaluateAlert(ctx context.Context, alert models.NetworkAlert) (*RemediationResult, error) {
	// 1. Get Device
	var device models.Device
	if alert.DeviceID == nil {
		return nil, fmt.Errorf("alert has no device ID")
	}
	if err := re.db.First(&device, *alert.DeviceID).Error; err != nil {
		return nil, err
	}

	// 2. Match Alert to Playbook (Brain Upgrade: Neural Search first)
	var playbook *Playbook
	var pbID string // Keep pbID for bandit update later

	if re.neuralService != nil {
		advice, _ := re.neuralService.GetRemediationAdvice(alert.Message)
		if advice != nil {
			suggestedFix := advice.Metadata["suggested_fix"].(string)
			playbook = &Playbook{
				Name:        fmt.Sprintf("Neural Fix: %s", advice.ID),
				Description: fmt.Sprintf("AI Suggested fix based on incident %s", advice.ID),
				Action: func(ctx context.Context, device models.Device, alert models.NetworkAlert) error {
					log.Printf("🧠 Executing Neural Fix [%s]: %s", advice.ID, suggestedFix)
					_, err := re.configService.RunCommand(device, suggestedFix)
					return err
				},
			}
			pbID = fmt.Sprintf("neural_%s", advice.ID) // Assign a unique ID for neural playbooks
		}
	}

	// Fallback to simple rule matching if no neural advice
	if playbook == nil {
		// Define available candidates for this alert type for bandit
		candidates := []string{}
		if strings.Contains(strings.ToLower(alert.Message), "high cpu") {
			candidates = []string{"clear_cache", "service_restart", "log_rotate"}
		} else if strings.Contains(strings.ToLower(alert.Message), "interface down") {
			candidates = []string{"bounce_if", "flap_port"}
		} else if strings.Contains(strings.ToLower(alert.Message), "bgp neighbor down") {
			candidates = []string{"bgp_soft_reset", "clear_bgp_all"}
		}

		if len(candidates) > 0 {
			pbID = re.bandit.SelectAction(alert.Message, candidates)
			playbook = re.getPlaybookByID(pbID)
		}
	}

	if playbook == nil {
		return nil, nil // No remediation available
	}

	log.Printf("🤖 Auto-Remediation: Executing %s for device %s", playbook.Name, device.Hostname)

	// 3. Execute Playbook
	err := playbook.Action(ctx, device, alert)
	success := err == nil
	output := "Executed successfully"
	if err != nil {
		output = err.Error()
	}

	result := &RemediationResult{
		AlertID:   alert.ID,
		Action:    playbook.Name,
		Success:   success,
		Output:    output,
		Timestamp: time.Now(),
	}

	// 4. Log Result and Evolve Bandit
	re.bandit.UpdateReward(pbID, success)

	if success {
		// Mark alert as resolved by bot
		re.db.Model(&alert).Updates(map[string]interface{}{
			"resolved":         true,
			"resolution_notes": fmt.Sprintf("Auto-resolved by Evolved AIOps Bandit [%s]: %s", pbID, playbook.Name),
		})
	}

	return result, nil
}

// Playbook Definitions

func (re *RemediationEngine) getHighCPUPlaybook() *Playbook {
	return &Playbook{
		Name:        "Clear Process Cache",
		Description: "Clears non-essential process caches to free CPU",
		Action: func(ctx context.Context, device models.Device, alert models.NetworkAlert) error {
			// In real life, detailed command.
			cmd := "clear ip cache flow"
			_, err := re.configService.RunCommand(device, cmd)
			return err
		},
	}
}

func (re *RemediationEngine) getInterfaceResetPlaybook() *Playbook {
	return &Playbook{
		Name:        "Bounce Interface",
		Description: "Shuts and no-shuts the impacted interface",
		Action: func(ctx context.Context, device models.Device, alert models.NetworkAlert) error {
			// Regex to find interface name
			reIf := regexp.MustCompile(`(?i)(?:interface|port)\s+([a-zA-Z0-9\/\-\.]+)`)
			match := reIf.FindStringSubmatch(alert.Message)
			if len(match) < 2 {
				return fmt.Errorf("failed to identify interface in alert: %s", alert.Message)
			}
			iface := match[1]

			// Bounce interface commands
			cmds := []string{
				fmt.Sprintf("interface %s", iface),
				"shutdown",
				"no shutdown",
			}
			for _, cmd := range cmds {
				_, err := re.configService.RunCommand(device, cmd)
				if err != nil {
					return err
				}
			}
			return nil
		},
	}
}

func (re *RemediationEngine) getRestartBGPPlaybook() *Playbook {
	return &Playbook{
		Name:        "Soft Reset BGP",
		Description: "Performs soft reset of BGP peers",
		Action: func(ctx context.Context, device models.Device, alert models.NetworkAlert) error {
			cmd := "clear ip bgp * soft"
			_, err := re.configService.RunCommand(device, cmd)
			return err
		},
	}
}
func (re *RemediationEngine) getPlaybookByID(id string) *Playbook {
	switch id {
	case "clear_cache":
		return re.getHighCPUPlaybook()
	case "bgp_soft_reset":
		return re.getRestartBGPPlaybook()
	case "bounce_if":
		return re.getInterfaceResetPlaybook()
	default:
		// Fallback for new playbooks that don't have code actions yet
		return &Playbook{Name: id, Description: "Generic evolutionary placeholder", Action: func(ctx context.Context, device models.Device, alert models.NetworkAlert) error { return nil }}
	}
}
