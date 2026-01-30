package provisioning

import (
	"fmt"
	"strings"

	"github.com/go-routeros/routeros"
)

type MikroTikClient struct {
	Addr     string
	Username string
	Password string
}

func (m *MikroTikClient) connect() (*routeros.Client, error) {
	return routeros.Dial(m.Addr, m.Username, m.Password)
}

// AddHotspotUser adds a user to $/ip/hotspot/user
func (m *MikroTikClient) AddHotspotUser(name, password, profile, mac string) error {
	client, err := m.connect()
	if err != nil {
		return err
	}
	defer client.Close()

	cmd := fmt.Sprintf("/ip/hotspot/user/add=name=%s=password=%s=profile=%s=mac-address=%s", name, password, profile, mac)
	_, err = client.Run(strings.Split(cmd, "=")...)
	return err
}

// AddPPPoESecret adds a user to $/ppp/secret
func (m *MikroTikClient) AddPPPoESecret(name, password, profile, remoteIP string) error {
	client, err := m.connect()
	if err != nil {
		return err
	}
	defer client.Close()

	cmd := fmt.Sprintf("/ppp/secret/add=name=%s=password=%s=service=pppoe=profile=%s=remote-address=%s", name, password, profile, remoteIP)
	_, err = client.Run(strings.Split(cmd, "=")...)
	return err
}

// SetQueue limits bandwidth for a target IP
func (m *MikroTikClient) SetQueue(name, target, limitAt, maxLimit string) error {
	client, err := m.connect()
	if err != nil {
		return err
	}
	defer client.Close()

	// limitAt: 512k/512k, maxLimit: 2M/2M
	cmd := fmt.Sprintf("/queue/simple/add=name=%s=target=%s=limit-at=%s=max-limit=%s", name, target, limitAt, maxLimit)
	_, err = client.Run(strings.Split(cmd, "=")...)
	return err
}

// RemoveHotspotUser removes a user
func (m *MikroTikClient) RemoveHotspotUser(name string) error {
	client, err := m.connect()
	if err != nil {
		return err
	}
	defer client.Close()

	// First find the .id
	reply, err := client.Run("/ip/hotspot/user/print", "?name="+name)
	if err != nil || len(reply.Re) == 0 {
		return err
	}
	id := reply.Re[0].Map[".id"]

	_, err = client.Run("/ip/hotspot/user/remove", "=.id="+id)
	return err
}

// MarkTraffic adds mangle rules for specific categories (AIOps/Turbo feature 👽)
func (m *MikroTikClient) MarkTraffic(targetIP string, category string) error {
	client, err := m.connect()
	if err != nil {
		return err
	}
	defer client.Close()

	// categories: "gaming", "multimedia", "voip"
	var portRange string
	var markName string

	switch category {
	case "gaming":
		portRange = "27000-27100,3478-3480" // Example Steam/Console ports
		markName = "G_TRAFFIC"
	case "multimedia":
		portRange = "80,443,1935" // Streaming
		markName = "S_TRAFFIC"
	default:
		return fmt.Errorf("unknown traffic category: %s", category)
	}

	// 1. Mark Connection
	cmd1 := fmt.Sprintf("/ip/firewall/mangle/add=chain=prerouting=src-address=%s=protocol=udp=dst-port=%s=action=mark-connection=new-connection-mark=%s_CONN=passthrough=yes", targetIP, portRange, markName)
	_, err = client.Run(strings.Split(cmd1, "=")...)
	if err != nil {
		return err
	}

	// 2. Mark Packet
	cmd2 := fmt.Sprintf("/ip/firewall/mangle/add=chain=prerouting=connection-mark=%s_CONN=action=mark-packet=new-packet-mark=%s_PKT=passthrough=no", markName, markName)
	_, err = client.Run(strings.Split(cmd2, "=")...)
	return err
}
