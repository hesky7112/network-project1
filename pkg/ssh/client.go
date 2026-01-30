package ssh

import (
	"bufio"
	"fmt"
	"strings"
	"time"

	"golang.org/x/crypto/ssh"
)

// SSHClient defines the behavior for SSH connections
type SSHClient interface {
	Connect() error
	RunCommand(cmd string) (string, error)
	RunShellCommands(commands []string) (string, error)
	Close()
}

// Client wraps the SSH connection logic
// It implements SSHClient
type Client struct {
	User     string
	Password string
	Host     string
	Port     int
	Timeout  time.Duration
	client   *ssh.Client
	session  *ssh.Session
}

type AuthConfig struct {
	User     string
	Password string
	Host     string
	Port     int
	Timeout  time.Duration
}

// NewClient creates a new SSH client instance
func NewClient(config AuthConfig) *Client {
	if config.Port == 0 {
		config.Port = 22
	}
	if config.Timeout == 0 {
		config.Timeout = 10 * time.Second
	}
	return &Client{
		User:     config.User,
		Password: config.Password,
		Host:     config.Host,
		Port:     config.Port,
		Timeout:  config.Timeout,
	}
}

// Connect establishes the SSH connection
func (c *Client) Connect() error {
	config := &ssh.ClientConfig{
		User: c.User,
		Auth: []ssh.AuthMethod{
			ssh.Password(c.Password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // For internal automation this is common, ideally use known_hosts
		Timeout:         c.Timeout,
	}

	addr := fmt.Sprintf("%s:%d", c.Host, c.Port)
	client, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		return err
	}
	c.client = client
	return nil
}

// RunCommand executes a single command and returns output
func (c *Client) RunCommand(cmd string) (string, error) {
	if c.client == nil {
		if err := c.Connect(); err != nil {
			return "", err
		}
	}

	session, err := c.client.NewSession()
	if err != nil {
		return "", err
	}
	defer session.Close()

	if strings.HasPrefix(cmd, "configure") || strings.HasPrefix(cmd, "conf t") {
		// If it's a config command, we might need a shell to handle prompts/state
		// simpler approach for "RunCommand" is usually just exec if the device supports it
		// But network gear often needs a shell for context.
		// For now, let's try standard Output() which runs 'exec'
		output, err := session.CombinedOutput(cmd)
		return string(output), err
	}

	// Standard exec
	output, err := session.CombinedOutput(cmd)
	return string(output), err
}

// RunShellCommands runs a sequence of commands in a pseudo-terminal (shell)
// This is better for Cisco/Juniper config modes
func (c *Client) RunShellCommands(commands []string) (string, error) {
	if c.client == nil {
		if err := c.Connect(); err != nil {
			return "", err
		}
	}

	session, err := c.client.NewSession()
	if err != nil {
		return "", err
	}
	defer session.Close()

	modes := ssh.TerminalModes{
		ssh.ECHO:          0,     // disable echoing
		ssh.TTY_OP_ISPEED: 14400, // input speed = 14.4kbaud
		ssh.TTY_OP_OSPEED: 14400, // output speed = 14.4kbaud
	}

	if err := session.RequestPty("xterm", 80, 40, modes); err != nil {
		return "", fmt.Errorf("request for pty failed: %w", err)
	}

	stdin, err := session.StdinPipe()
	if err != nil {
		return "", err
	}
	stdout, err := session.StdoutPipe()
	if err != nil {
		return "", err
	}

	if err := session.Start("shell"); err != nil {
		// Some devices don't take "shell", might just need Start("") or Shell()
		if err := session.Shell(); err != nil {
			return "", err
		}
	}

	var output strings.Builder
	// Reader routine
	done := make(chan bool)
	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			output.WriteString(scanner.Text() + "\n")
		}
		done <- true
	}()

	// Execute commands
	for _, cmd := range commands {
		fmt.Fprintf(stdin, "%s\n", cmd)
		time.Sleep(200 * time.Millisecond) // Pace the commands slightly
	}
	// Exit shell
	fmt.Fprintf(stdin, "exit\n")

	// Wait a bit for output to flush
	time.Sleep(500 * time.Millisecond)
	session.Close() // Close session to stop reader
	<-done

	return output.String(), nil
}

func (c *Client) Close() {
	if c.client != nil {
		c.client.Close()
	}
}
