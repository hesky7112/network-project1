package snmp

import (
	"fmt"
	"log"
	"net"
	"strings"
	"sync"
	"time"

	"github.com/gosnmp/gosnmp"
	"gorm.io/gorm"
)

// Alert represents a stored SNMP trap or alert
type Alert struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SourceIP  string    `json:"source_ip"`
	OID       string    `json:"oid"`
	Value     string    `json:"value"`
	Severity  string    `json:"severity"` // info, warning, critical
	Timestamp time.Time `json:"timestamp"`
	RawData   string    `json:"raw_data"`
}

type Service struct {
	db          *gorm.DB
	port        int
	listener    *gosnmp.TrapListener
	mibRegistry *MIBRegistry
	ruleEngine  *RuleEngine
	mu          sync.RWMutex
}

func NewService(db *gorm.DB, port int) *Service {
	if port == 0 {
		port = 1162 // Default non-privileged port for dev
	}
	return &Service{
		db:          db,
		port:        port,
		mibRegistry: NewMIBRegistry(),
		ruleEngine:  NewRuleEngine(),
	}
}

// Start runs the SNMP Trap Receiver in a goroutine
func (s *Service) Start() error {
	s.listener = &gosnmp.TrapListener{
		OnNewTrap: s.handleTrap,
		Params:    gosnmp.Default,
	}

	addr := fmt.Sprintf("0.0.0.0:%d", s.port)
	log.Printf("📡 [SNMP] Trap Receiver listening on UDP %s", addr)

	go func() {
		err := s.listener.Listen(addr)
		if err != nil {
			log.Printf("❌ [SNMP] Error listening: %v", err)
		}
	}()

	return nil
}

func (s *Service) Stop() {
	if s.listener != nil {
		s.listener.Close()
	}
}

func (s *Service) handleTrap(packet *gosnmp.SnmpPacket, addr *net.UDPAddr) {
	// log.Printf("🔔 [SNMP] Received trap from %s", addr.IP.String())

	var alert Alert
	alert.SourceIP = addr.IP.String()
	alert.Timestamp = time.Now()
	alert.Severity = "info"

	// Parse Variables (VarBinds)
	var processedVars []string

	for _, pdu := range packet.Variables {
		// Translate OID
		translatedOID := s.mibRegistry.Translate(pdu.Name)
		value := fmt.Sprintf("%v", pdu.Value)

		// Evaluate Severity based on rules
		severity := s.ruleEngine.Evaluate(translatedOID, value)
		if severity == "critical" {
			alert.Severity = "critical"
		} else if severity == "warning" && alert.Severity != "critical" {
			alert.Severity = "warning"
		}

		// Capture the first meaningful OID/Value for the main record
		if alert.OID == "" {
			alert.OID = translatedOID
			alert.Value = value
		}

		processedVars = append(processedVars, fmt.Sprintf("%s=%s", translatedOID, value))
	}

	alert.RawData = strings.Join(processedVars, "; ")

	// Save to DB
	if err := s.db.Create(&alert).Error; err != nil {
		log.Printf("❌ [SNMP] Failed to save alert: %v", err)
	} else {
		// Only log critical/significant alerts to reduce noise
		if alert.Severity != "info" {
			log.Printf("🚨 [SNMP] %s Alert from %s: %s (%s)", strings.ToUpper(alert.Severity), alert.SourceIP, alert.OID, alert.Value)
		}
	}
}

// GetRecentAlerts returns the last N alerts
func (s *Service) GetRecentAlerts(limit int) ([]Alert, error) {
	var alerts []Alert
	result := s.db.Order("timestamp desc").Limit(limit).Find(&alerts)
	return alerts, result.Error
}
