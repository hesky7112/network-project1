package ssh

import (
	"strings"
	"testing"
)

// MockSSHClient simulates an SSH connection without network I/O
type MockSSHClient struct {
	Connected        bool
	CommandsExecuted []string
	MockOutput       string
	ShouldFail       bool
}

func (m *MockSSHClient) Connect() error {
	m.Connected = true
	return nil
}

func (m *MockSSHClient) RunCommand(cmd string) (string, error) {
	m.CommandsExecuted = append(m.CommandsExecuted, cmd)
	return "Mock Output: " + cmd, nil
}

func (m *MockSSHClient) RunShellCommands(commands []string) (string, error) {
	m.CommandsExecuted = append(m.CommandsExecuted, commands...)
	return "Mock Shell Output\n" + strings.Join(commands, "\n"), nil
}

func (m *MockSSHClient) Close() {
	m.Connected = false
}

// TestConfigBackupSafety demonstrates how we test logic safely
func TestConfigBackupSafety(t *testing.T) {
	// 1. Setup Mock
	mock := &MockSSHClient{}

	// 2. Define the "Dangerous" Command
	cmd := "copy running-config tftp://1.2.3.4/backup"

	// 3. Execute logic using the Mock (instead of Real Client)
	// In a real app, you'd inject 'mock' into your Service
	output, err := mock.RunCommand(cmd)

	// 4. Verify results
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if !strings.Contains(output, "Mock Output") {
		t.Errorf("Expected mock output, got %s", output)
	}

	// 5. Critical Check: Ensure we tracked the command
	if len(mock.CommandsExecuted) != 1 {
		t.Errorf("Expected 1 command, got %d", len(mock.CommandsExecuted))
	}

	if mock.CommandsExecuted[0] != cmd {
		t.Errorf("Expected command '%s', got '%s'", cmd, mock.CommandsExecuted[0])
	}

	t.Log("✅ Test passed safely without touching real network devices.")
}
