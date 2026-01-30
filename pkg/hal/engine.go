package hal

import (
	"runtime"
)

// PlatformInfo contains details about the running hardware
type PlatformInfo struct {
	OS           string   `json:"os"`
	Arch         string   `json:"arch"`
	Capabilities []string `json:"capabilities"`
}

// GetPlatformInfo detects the current execution environment
func GetPlatformInfo() *PlatformInfo {
	info := &PlatformInfo{
		OS:   runtime.GOOS,
		Arch: runtime.GOARCH,
	}

	info.detectCapabilities()
	return info
}

func (p *PlatformInfo) detectCapabilities() {
	var caps []string

	// Basic kernel-level capability assumptions
	if p.OS == "linux" {
		caps = append(caps, "routing", "netfilter", "raw_sockets")
	}

	// Architecture-specific capabilities
	if p.Arch == "arm" || p.Arch == "arm64" {
		caps = append(caps, "gpio", "low_power_optimization")
	}

	if p.Arch == "amd64" {
		caps = append(caps, "virtualization", "heavy_neural_crunching")
	}

	p.Capabilities = caps
}

// IsRaspberryPi performs a loose check for Pi-like hardware
func (p *PlatformInfo) IsRaspberryPi() bool {
	return (p.Arch == "arm" || p.Arch == "arm64") && p.OS == "linux"
}

// CanRoute checks if the platform supports native routing
func (p *PlatformInfo) CanRoute() bool {
	return p.OS == "linux"
}
