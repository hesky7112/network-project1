package provisioning

import (
	"fmt"

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

	// Safe command construction
	_, err = client.Run("/ip/hotspot/user/add", "=name="+name, "=password="+password, "=profile="+profile, "=mac-address="+mac)
	return err
}

// AddPPPoESecret adds a user to $/ppp/secret
func (m *MikroTikClient) AddPPPoESecret(name, password, profile, remoteIP string) error {
	client, err := m.connect()
	if err != nil {
		return err
	}
	defer client.Close()

	// Safe command construction
	_, err = client.Run("/ppp/secret/add", "=name="+name, "=password="+password, "=service=pppoe", "=profile="+profile, "=remote-address="+remoteIP)
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
	_, err = client.Run("/queue/simple/add", "=name="+name, "=target="+target, "=limit-at="+limitAt, "=max-limit="+maxLimit)
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
	_, err = client.Run("/ip/firewall/mangle/add", "=chain=prerouting", "=src-address="+targetIP, "=protocol=udp", "=dst-port="+portRange, "=action=mark-connection", "=new-connection-mark="+markName+"_CONN", "=passthrough=yes")
	if err != nil {
		return err
	}

	// 2. Mark Packet
	_, err = client.Run("/ip/firewall/mangle/add", "=chain=prerouting", "=connection-mark="+markName+"_CONN", "=action=mark-packet", "=new-packet-mark="+markName+"_PKT", "=passthrough=no")
	return err
}
