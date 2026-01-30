package netconfig

import (
	"networking-main/pkg/ssh"
	"strings"
)

// BaseDriver provides common functionality for SSH-based network drivers
type BaseDriver struct{}

// Connect creates an SSH client for the given connection
func (b *BaseDriver) Connect(conn DeviceConnection) (*ssh.Client, error) {
	client := ssh.NewClient(ssh.AuthConfig{
		User:     conn.Username,
		Password: conn.Password,
		Host:     conn.IPAddress,
		Port:     conn.Port,
	})
	return client, nil
}

// RunSimpleCommands connects, runs commands, and closes the connection
func (b *BaseDriver) RunSimpleCommands(conn DeviceConnection, commands []string) (string, error) {
	client, err := b.Connect(conn)
	if err != nil {
		return "", err
	}
	defer client.Close()

	return client.RunShellCommands(commands)
}

// PushConfig pushes a standard configuration block to a device
func (b *BaseDriver) PushConfig(conn DeviceConnection, config string, enterConfigMode, exitConfigMode, saveConfig string) error {
	commands := []string{enterConfigMode}

	// Split config into lines if it's a large block
	lines := b.splitConfig(config)
	commands = append(commands, lines...)

	if exitConfigMode != "" {
		commands = append(commands, exitConfigMode)
	}
	if saveConfig != "" {
		commands = append(commands, saveConfig)
	}

	_, err := b.RunSimpleCommands(conn, commands)
	return err
}

func (b *BaseDriver) splitConfig(config string) []string {
	// Standardize line endings and split
	raw := strings.ReplaceAll(config, "\r\n", "\n")
	return strings.Split(raw, "\n")
}
