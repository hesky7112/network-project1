package netconfig

import (
	"fmt"
	"strings"
	"time"

	"networking-main/pkg/sshpool"

	"golang.org/x/crypto/ssh"
)

// AutomationService handles direct device interactions
type AutomationService struct {
	pool *sshpool.Pooler
}

func NewAutomationService() *AutomationService {
	return &AutomationService{
		pool: sshpool.NewPooler(),
	}
}

// DeviceDriver interface for vendor-specific commands
type DeviceDriver interface {
	SendCommand(cmd string) (string, error)
	EnterConfigMode() error
	ExitConfigMode() error
	Commit() error
	ApplyConfig(lines []string) error
}

// GetDriver returns the appropriate driver for the device type
func (s *AutomationService) GetDriver(driverType, ip, username, password string) (DeviceDriver, error) {
	config := &ssh.ClientConfig{
		User: username,
		Auth: []ssh.AuthMethod{
			ssh.Password(password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	}

	client, err := s.pool.GetClient(ip+":22", config)
	if err != nil {
		return nil, err
	}

	switch driverType {
	case "cisco_ios":
		return &CiscoIOSDriver{client: client}, nil
	case "mikrotik_routeros":
		return &MikroTikDriver{client: client}, nil
	default:
		return nil, fmt.Errorf("unsupported driver: %s", driverType)
	}
}

// === Cisco IOS Driver ===

type CiscoIOSDriver struct {
	client *sshpool.SSHClient
}

func (d *CiscoIOSDriver) SendCommand(cmd string) (string, error) {
	session, err := d.client.Conn.NewSession()
	if err != nil {
		return "", err
	}
	defer session.Close()

	output, err := session.CombinedOutput(cmd)
	if err != nil {
		return "", fmt.Errorf("command failed: %w", err)
	}
	return string(output), nil
}

func (d *CiscoIOSDriver) EnterConfigMode() error {
	_, err := d.SendCommand("configure terminal")
	return err
}

func (d *CiscoIOSDriver) ExitConfigMode() error {
	_, err := d.SendCommand("end")
	return err
}

func (d *CiscoIOSDriver) Commit() error {
	_, err := d.SendCommand("write memory")
	return err
}

func (d *CiscoIOSDriver) ApplyConfig(lines []string) error {
	commands := append([]string{"configure terminal"}, lines...)
	commands = append(commands, "end", "write memory")

	fullCmd := strings.Join(commands, "\n")

	// For reliable execution, usually one should expect prompts.
	// This is a simplified "send raw" implementation.
	_, err := d.SendCommand(fullCmd)
	return err
}

// === MikroTik RouterOS Driver ===

type MikroTikDriver struct {
	client *sshpool.SSHClient
}

func (d *MikroTikDriver) SendCommand(cmd string) (string, error) {
	session, err := d.client.Conn.NewSession()
	if err != nil {
		return "", err
	}
	defer session.Close()

	// MikroTik likes getting commands with ending newline
	output, err := session.CombinedOutput(cmd)
	if err != nil {
		return "", fmt.Errorf("mikrotik command failed: %w", err)
	}
	return string(output), nil
}

func (d *MikroTikDriver) EnterConfigMode() error {
	return nil // MikroTik is always in "config mode" basically, or explicit paths
}

func (d *MikroTikDriver) ExitConfigMode() error {
	return nil
}

func (d *MikroTikDriver) Commit() error {
	return nil // Auto-committed usually, or "safe mode" logic needed
}

func (d *MikroTikDriver) ApplyConfig(lines []string) error {
	// Concatenate commands with semicolon or newlines
	fullCmd := strings.Join(lines, " ; ")
	_, err := d.SendCommand(fullCmd)
	return err
}
