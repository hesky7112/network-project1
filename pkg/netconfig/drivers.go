package netconfig

import (
	"fmt"
	"strings"
	"sync"
)

// VendorDriver defines the interface for hardware-specific interactions
type VendorDriver interface {
	GetConfig(conn DeviceConnection) (string, error)
	ApplyConfig(conn DeviceConnection, config string) error
	CleanConfig(config string) string
	ParseOutput(command, output string) (interface{}, error)
}

var (
	registry = make(map[string]VendorDriver)
	regMu    sync.RWMutex
)

// RegisterDriver adds a new driver to the global registry
func RegisterDriver(name string, driver VendorDriver) {
	regMu.Lock()
	defer regMu.Unlock()
	registry[strings.ToLower(name)] = driver
}

// GetDriver retrieves a driver by vendor name
func GetDriver(name string) (VendorDriver, error) {
	regMu.RLock()
	defer regMu.RUnlock()

	driver, ok := registry[strings.ToLower(name)]
	if !ok {
		return nil, fmt.Errorf("no driver registered for vendor: %s", name)
	}
	return driver, nil
}
