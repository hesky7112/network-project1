package inventory

import (
	"fmt"
	"log"
	"strings"
	"time"

	"networking-main/internal/models"

	"github.com/gosnmp/gosnmp"
	"gorm.io/gorm"
)

type MACTracker struct {
	db *gorm.DB
}

func NewMACTracker(db *gorm.DB) *MACTracker {
	return &MACTracker{db: db}
}

// OIDs for Bridge MIB
const (
	oidDot1dTpFdbAddress    = "1.3.6.1.2.1.17.4.3.1.1" // MAC Address
	oidDot1dTpFdbPort       = "1.3.6.1.2.1.17.4.3.1.2" // Bridge Port Number
	oidDot1dBasePortIfIndex = "1.3.6.1.2.1.17.1.4.1.2" // Map Bridge Port -> Interface Index
)

// ScanDeviceMACs polls the Bridge MIB to find connected MAC addresses
func (mt *MACTracker) ScanDeviceMACs(device models.Device) error {
	client := &gosnmp.GoSNMP{
		Target:    device.IPAddress,
		Port:      161,
		Community: device.Community,
		Version:   gosnmp.Version2c,
		Timeout:   time.Duration(5) * time.Second,
	}
	if err := client.Connect(); err != nil {
		return err
	}
	defer client.Conn.Close()

	// 1. Get Bridge Port to IfIndex mapping
	portMap, err := mt.getBridgePortMapping(client)
	if err != nil {
		// Non-fatal, might not support bridge MIB, or direct mapping
		log.Printf("Could not get bridge port mapping for %s: %v", device.Hostname, err)
		portMap = make(map[int]int)
	}

	// 2. Get Forwarding Table (FDB)
	results, err := client.BulkWalkAll(oidDot1dTpFdbPort)
	if err != nil {
		return fmt.Errorf("failed to walk FDB: %w", err)
	}

	for _, pdu := range results {
		// OID suffix is the MAC address in decimal numbers
		oidParts := strings.Split(pdu.Name, ".")
		if len(oidParts) < 6 {
			continue
		}

		// Extract MAC from OID suffix (last 6 parts)
		macParts := oidParts[len(oidParts)-6:]
		macAddr := mt.oidToMac(macParts)

		bridgePort := gosnmp.ToBigInt(pdu.Value).Int64()

		// Map bridge port to interface index
		ifIndex, ok := portMap[int(bridgePort)]
		if !ok {
			ifIndex = int(bridgePort) // Fallback
		}

		// Store in DB
		// Note: We need a model for MACTable or just update Device interface logs
		// For now, let's assume a DeviceLocation table exists or create it
		// Or just log it

		log.Printf("Found MAC %s on Device %s Port %d (IfIndex %d)", macAddr, device.Hostname, bridgePort, ifIndex)

		// Update DB logic here...
		// mt.db.Create(...)
	}

	return nil
}

func (mt *MACTracker) getBridgePortMapping(client *gosnmp.GoSNMP) (map[int]int, error) {
	mapping := make(map[int]int)
	results, err := client.BulkWalkAll(oidDot1dBasePortIfIndex)
	if err != nil {
		return nil, err
	}

	for _, pdu := range results {
		// OID suffix is the bridge port
		parts := strings.Split(pdu.Name, ".")
		bridgePort := parts[len(parts)-1] // simplified parsing

		ifIndex := gosnmp.ToBigInt(pdu.Value).Int64()

		var bp int
		fmt.Sscanf(bridgePort, "%d", &bp)
		mapping[bp] = int(ifIndex)
	}
	return mapping, nil
}

func (mt *MACTracker) oidToMac(parts []string) string {
	var macParts []string
	for _, p := range parts {
		var b int
		fmt.Sscanf(p, "%d", &b)
		macParts = append(macParts, fmt.Sprintf("%02X", b))
	}
	return strings.Join(macParts, ":")
}
