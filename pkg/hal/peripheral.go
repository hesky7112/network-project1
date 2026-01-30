package hal

import (
	"fmt"
	"os"
	"strings"
)

// PeripheralType defines the kind of connected hardware
type PeripheralType string

const (
	PeripheralNFC       PeripheralType = "nfc"
	PeripheralBiometric PeripheralType = "biometric"
	PeripheralPrinter   PeripheralType = "printer"
	PeripheralSensor    PeripheralType = "sensor"
)

// Peripheral contains details about a connected specialized hardware
type Peripheral struct {
	ID       string            `json:"id"`
	Type     PeripheralType    `json:"type"`
	Port     string            `json:"port"` // /dev/ttyUSB0, GPIO_14, etc.
	Status   string            `json:"status"`
	Metadata map[string]string `json:"metadata"`
}

// DiscoverPeripherals looks for specialized hardware
func DiscoverPeripherals(p *PlatformInfo) []Peripheral {
	var found []Peripheral

	// 1. Check Serial/USB devices (Linux-centric)
	if p.OS == "linux" {
		found = append(found, scanUSBDevices()...)
	}

	// 2. Check GPIO on Raspberry Pi
	if p.IsRaspberryPi() {
		found = append(found, scanGPIOBus()...)
	}

	return found
}

func scanUSBDevices() []Peripheral {
	var found []Peripheral

	// Simulated check for /dev/ttyUSB* or /dev/ttyACM*
	// In a real implementation, we would list /dev/ directory or use libusb
	files, err := os.ReadDir("/dev")
	if err != nil {
		return found
	}

	for _, f := range files {
		name := f.Name()
		if strings.HasPrefix(name, "ttyUSB") || strings.HasPrefix(name, "ttyACM") {
			// Heuristic: Many NFC readers identify as specific serial devices
			found = append(found, Peripheral{
				ID:     fmt.Sprintf("USB-%s", name),
				Type:   PeripheralNFC,
				Port:   "/dev/" + name,
				Status: "detected",
				Metadata: map[string]string{
					"bus": "USB-Serial",
				},
			})
		}
	}

	return found
}

func scanGPIOBus() []Peripheral {
	// Simulated detection of common Pi hats or GPIO-wired sensors
	return []Peripheral{
		{
			ID:     "GPIO-NFC-PN532",
			Type:   PeripheralNFC,
			Port:   "I2C-1 / GPIO-14,15",
			Status: "ready",
			Metadata: map[string]string{
				"wiring": "I2C/UART",
			},
		},
	}
}
