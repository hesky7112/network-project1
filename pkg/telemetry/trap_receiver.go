package telemetry

import (
	"fmt"
	"log"
	"net"
	"strings"
	"time"

	"networking-main/internal/models"

	"github.com/gosnmp/gosnmp"
)

type TrapReceiver struct {
	service  *Service
	listener *gosnmp.TrapListener
	addr     string
}

func NewTrapReceiver(service *Service, addr string) *TrapReceiver {
	return &TrapReceiver{
		service: service,
		addr:    addr,
	}
}

func (tr *TrapReceiver) Start() error {
	tr.listener = gosnmp.NewTrapListener()
	tr.listener.OnNewTrap = tr.handleTrap
	tr.listener.Params = gosnmp.Default

	// Trap listener parameters
	tr.listener.Params.Community = "public" // Default, but traps might have different communities

	log.Printf("Starting SNMP Trap Receiver on %s", tr.addr)

	go func() {
		if err := tr.listener.Listen(tr.addr); err != nil {
			log.Printf("Error listening for traps: %v", err)
		}
	}()

	return nil
}

func (tr *TrapReceiver) Stop() {
	if tr.listener != nil {
		tr.listener.Close()
	}
}

func (tr *TrapReceiver) handleTrap(packet *gosnmp.SnmpPacket, addr *net.UDPAddr) {
	log.Printf("Received trap from %s", addr.IP.String())

	// 1. Identify Device
	var device models.Device
	// Try to find device by IP
	err := tr.service.db.Where("ip_address = ?", addr.IP.String()).First(&device).Error
	if err != nil {
		log.Printf("Trap received from unknown device: %s", addr.IP.String())
		// Optionally create a discovery job or "unknown device" alert
		return
	}

	// 2. Parse Trap Variables
	var message strings.Builder
	var severity = "warning"
	var alertType = "snmp_trap"

	message.WriteString(fmt.Sprintf("SNMP Trap received from %s (%s). ", device.Hostname, device.IPAddress))

	for _, v := range packet.Variables {
		// Basic OID to string mapping (could be enhanced with MIB lookup)
		switch v.Type {
		case gosnmp.OctetString:
			if bytes, ok := v.Value.([]byte); ok {
				message.WriteString(fmt.Sprintf("%s: %s; ", v.Name, string(bytes)))
			}
		case gosnmp.Integer:
			message.WriteString(fmt.Sprintf("%s: %d; ", v.Name, v.Value))
		default:
			message.WriteString(fmt.Sprintf("%s: %v; ", v.Name, v.Value))
		}

		// Simple heuristics for severity
		if strings.Contains(strings.ToLower(fmt.Sprintf("%v", v.Value)), "down") ||
			strings.Contains(strings.ToLower(fmt.Sprintf("%v", v.Value)), "fail") ||
			strings.Contains(strings.ToLower(fmt.Sprintf("%v", v.Value)), "critical") {
			severity = "critical"
		}
	}

	// 3. Create Alert
	alert := models.NetworkAlert{
		DeviceID:     &device.ID,
		Type:         alertType,
		Severity:     severity,
		Message:      message.String(),
		Acknowledged: false,
		Resolved:     false,
		CreatedAt:    time.Now(),
	}

	if err := tr.service.db.Create(&alert).Error; err != nil {
		log.Printf("Failed to save trap alert: %v", err)
		return
	}

	// 4. Real-time Notification (using existing mechanism if available, or just Redis)
	// For now, we rely on the periodic poller or websocket stream picking up the new alert
	// Ideally: tr.service.BroadcastAlert(alert)
}
