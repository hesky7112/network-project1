package telemetry

import (
	"fmt"
	"log"

	"networking-main/internal/models"

	"github.com/gosnmp/gosnmp"
	"gorm.io/gorm"
)

type RoutingCollector struct {
	db *gorm.DB
}

func NewRoutingCollector(db *gorm.DB) *RoutingCollector {
	return &RoutingCollector{db: db}
}

// OIDs for Routing Protocols
const (
	// BGP
	oidBGPPeerState = "1.3.6.1.2.1.15.3.1.2" // bgpPeerState

	// OSPF
	oidOSPFNbrState = "1.3.6.1.2.1.14.10.1.6" // ospfNbrState
)

func (rc *RoutingCollector) CheckRoutingHealth(device models.Device, client *gosnmp.GoSNMP) error {
	// 1. Check BGP Peers
	if err := rc.checkBGP(device, client); err != nil {
		log.Printf("BGP check failed for %s: %v", device.IPAddress, err)
	}

	// 2. Check OSPF Neighbors
	if err := rc.checkOSPF(device, client); err != nil {
		log.Printf("OSPF check failed for %s: %v", device.IPAddress, err)
	}

	return nil
}

func (rc *RoutingCollector) checkBGP(device models.Device, client *gosnmp.GoSNMP) error {
	results, err := client.BulkWalkAll(oidBGPPeerState)
	if err != nil {
		return err // Might not support BGP
	}

	for _, pdu := range results {
		// OID suffix contains peer IP
		// State: 1=idle, 6=established
		state := gosnmp.ToBigInt(pdu.Value).Int64()
		if state != 6 {
			// Alert!
			rc.createRoutingAlert(device, "bgp", fmt.Sprintf("BGP Peer down (OID: %s, State: %d)", pdu.Name, state))
		}
	}
	return nil
}

func (rc *RoutingCollector) checkOSPF(device models.Device, client *gosnmp.GoSNMP) error {
	results, err := client.BulkWalkAll(oidOSPFNbrState)
	if err != nil {
		return err // Might not support OSPF
	}

	for _, pdu := range results {
		// State: 8=full
		state := gosnmp.ToBigInt(pdu.Value).Int64()
		if state < 8 {
			// Alert! (simplified, some states are transient)
			rc.createRoutingAlert(device, "ospf", fmt.Sprintf("OSPF Neighbor not FULL (OID: %s, State: %d)", pdu.Name, state))
		}
	}
	return nil
}

func (rc *RoutingCollector) createRoutingAlert(device models.Device, protocol, msg string) {
	alert := models.NetworkAlert{
		DeviceID: &device.ID,
		Type:     "routing_protocol_down",
		Severity: "critical",
		Message:  fmt.Sprintf("[%s] %s", protocol, msg),
	}
	// Simplified creation, assumes DB access
	rc.db.Create(&alert)
}
