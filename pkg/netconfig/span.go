package netconfig

import (
	"fmt"
	"strings"

	"networking-main/internal/models"
)

// SPANManager handles Port Mirroring / SPAN configuration
type SPANManager struct {
	manager *ConfigManager
}

type SPANSession struct {
	ID          int
	SourcePorts []string // "GigabitEthernet0/1", "GigabitEthernet0/2"
	DestPort    string   // "GigabitEthernet0/24"
	Direction   string   // "both", "rx", "tx"
	Description string
}

func NewSPANManager(cm *ConfigManager) *SPANManager {
	return &SPANManager{manager: cm}
}

// ConfigureSPANSession applies SPAN configuration to a device
func (sm *SPANManager) ConfigureSPANSession(device models.Device, session SPANSession) error {
	conn := DeviceConnection{
		IPAddress:  device.IPAddress,
		Username:   device.Username,
		Password:   device.Password,
		Port:       22,
		DeviceType: device.DeviceType,
	}

	var commands []string
	switch strings.ToLower(device.DeviceType) {
	case "cisco", "cisco_ios":
		commands = sm.generateCiscoSPANCommands(session)
	default:
		return fmt.Errorf("SPAN not supported for device type: %s", device.DeviceType)
	}

	configBlock := strings.Join(commands, "\n")
	return sm.manager.pushConfigToDevice(conn, configBlock)
}

// RemoveSPANSession removes a SPAN session
func (sm *SPANManager) RemoveSPANSession(device models.Device, sessionID int) error {
	conn := DeviceConnection{
		IPAddress:  device.IPAddress,
		Username:   device.Username,
		Password:   device.Password,
		Port:       22,
		DeviceType: device.DeviceType,
	}

	cmd := fmt.Sprintf("no monitor session %d", sessionID)
	return sm.manager.pushConfigToDevice(conn, cmd)
}

func (sm *SPANManager) generateCiscoSPANCommands(session SPANSession) []string {
	var cmds []string

	// Clear existing session first to be safe
	cmds = append(cmds, fmt.Sprintf("no monitor session %d", session.ID))

	// Configure sources
	direction := ""
	if session.Direction == "rx" || session.Direction == "tx" {
		direction = " " + session.Direction
	}

	sourceStr := strings.Join(session.SourcePorts, ", ")
	cmds = append(cmds, fmt.Sprintf("monitor session %d source interface %s%s", session.ID, sourceStr, direction))

	// Configure destination
	cmds = append(cmds, fmt.Sprintf("monitor session %d destination interface %s", session.ID, session.DestPort))

	return cmds
}
