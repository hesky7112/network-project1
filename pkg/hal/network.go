package hal

import (
	"net"
	"strings"
)

// InterfaceInfo describes a physical or virtual network port
type InterfaceInfo struct {
	Name     string   `json:"name"`
	Hardware string   `json:"hardware_addr"`
	IPs      []string `json:"ips"`
	Role     string   `json:"role"` // wan, lan, management, unknown
	IsUp     bool     `json:"is_up"`
	IsLoop   bool     `json:"is_loopback"`
}

// ListInterfaces retrieves and classifies all network ports
func ListInterfaces() ([]InterfaceInfo, error) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	var infos []InterfaceInfo
	for _, iface := range ifaces {
		info := InterfaceInfo{
			Name:     iface.Name,
			Hardware: iface.HardwareAddr.String(),
			IsUp:     (iface.Flags & net.FlagUp) != 0,
			IsLoop:   (iface.Flags & net.FlagLoopback) != 0,
		}

		// Skip loopback for role assignment
		if !info.IsLoop {
			info.Role = classifyRole(iface.Name)
		} else {
			info.Role = "loopback"
		}

		addrs, _ := iface.Addrs()
		for _, addr := range addrs {
			info.IPs = append(info.IPs, addr.String())
		}

		infos = append(infos, info)
	}

	return infos, nil
}

func classifyRole(name string) string {
	name = strings.ToLower(name)

	// Common WAN/LAN naming conventions
	if strings.Contains(name, "eth0") || strings.Contains(name, "wan") || strings.Contains(name, "enp0") {
		return "wan"
	}
	if strings.Contains(name, "eth1") || strings.Contains(name, "lan") || strings.Contains(name, "enp1") {
		return "lan"
	}

	// Specific for Raspberry Pi Wi-Fi
	if strings.Contains(name, "wlan") {
		return "wireless"
	}

	return "unknown"
}
