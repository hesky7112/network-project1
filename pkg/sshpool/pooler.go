package sshpool

import (
	"context"
	"fmt"
	"sync"

	"golang.org/x/crypto/ssh"
)

// SSHClient represents a managed SSH session in the pool
type SSHClient struct {
	Config *ssh.ClientConfig
	Conn   *ssh.Client
	Mu     sync.Mutex
}

// Pooler manages thousands of concurrent SSH connections
type Pooler struct {
	clients map[string]*SSHClient
	mu      sync.RWMutex
}

func NewPooler() *Pooler {
	return &Pooler{
		clients: make(map[string]*SSHClient),
	}
}

// GetClient retrieves or creates an SSH connection for a device
func (p *Pooler) GetClient(addr string, config *ssh.ClientConfig) (*SSHClient, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if client, ok := p.clients[addr]; ok {
		return client, nil
	}

	// Dial with timeout for King tier responsiveness
	conn, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		return nil, fmt.Errorf("failed to dial: %w", err)
	}

	client := &SSHClient{
		Config: config,
		Conn:   conn,
	}
	p.clients[addr] = client
	return client, nil
}

// ExecuteCommand runs a command concurrently and returns the output
func (p *Pooler) ExecuteCommand(ctx context.Context, addr string, cmd string) (string, error) {
	client, ok := p.getCachedClient(addr)
	if !ok {
		return "", fmt.Errorf("client not connected: %s", addr)
	}

	client.Mu.Lock()
	defer client.Mu.Unlock()

	session, err := client.Conn.NewSession()
	if err != nil {
		return "", err
	}
	defer session.Close()

	output, err := session.CombinedOutput(cmd)
	if err != nil {
		return "", fmt.Errorf("cmd failed: %w (output: %s)", err, string(output))
	}

	return string(output), nil
}

func (p *Pooler) getCachedClient(addr string) (*SSHClient, bool) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	c, ok := p.clients[addr]
	return c, ok
}

// CloseAll cleans up all sessions (Shutdown sequence 🛸)
func (p *Pooler) CloseAll() {
	p.mu.Lock()
	defer p.mu.Unlock()
	for addr, client := range p.clients {
		client.Conn.Close()
		delete(p.clients, addr)
	}
}
