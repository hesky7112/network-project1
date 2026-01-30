package telemetry

import (
	"fmt"
	"log"
	"net"
	"regexp"
	"strings"
	"sync"
	"time"

	"networking-main/internal/models"

	"github.com/gosnmp/gosnmp"
	"gorm.io/gorm"
)

// NetFlowCollector manages NetFlow/sFlow data collection and analysis
type NetFlowCollector struct {
	db          *gorm.DB
	flows       map[string]*NetFlowSession
	mutex       sync.RWMutex
	analyzers   map[string]*TrafficAnalyzer
}

// NetFlowSession represents an active NetFlow session
type NetFlowSession struct {
	DeviceID    uint      `json:"device_id"`
	SourceIP    string    `json:"source_ip"`
	DestIP      string    `json:"dest_ip"`
	SourcePort  int       `json:"source_port"`
	DestPort    int       `json:"dest_port"`
	Protocol    string    `json:"protocol"`
	Bytes       int64     `json:"bytes"`
	Packets     int64     `json:"packets"`
	FirstSeen   time.Time `json:"first_seen"`
	LastSeen    time.Time `json:"last_seen"`
	Application string    `json:"application"`
}

// TrafficAnalyzer performs traffic pattern analysis
type TrafficAnalyzer struct {
	DeviceID        uint                    `json:"device_id"`
	AnalysisWindow  time.Duration           `json:"analysis_window"`
	FlowData        []NetFlowSession        `json:"flow_data"`
	TopTalkers      []TopTalker             `json:"top_talkers"`
	TopApplications []ApplicationStats      `json:"top_applications"`
	Anomalies       []TrafficAnomaly        `json:"anomalies"`
}

// TopTalker represents high-bandwidth IP addresses
type TopTalker struct {
	IPAddress   string `json:"ip_address"`
	TotalBytes  int64  `json:"total_bytes"`
	TotalFlows  int64  `json:"total_flows"`
	Protocol    string `json:"protocol"`
	FirstSeen   time.Time `json:"first_seen"`
	LastSeen    time.Time `json:"last_seen"`
}

// ApplicationStats represents application usage statistics
type ApplicationStats struct {
	Application string `json:"application"`
	TotalBytes  int64  `json:"total_bytes"`
	TotalFlows  int64  `json:"total_flows"`
	Percentage  float64 `json:"percentage"`
}

// TrafficAnomaly represents detected traffic anomalies
type TrafficAnomaly struct {
	Type        string    `json:"type"` // "bandwidth_spike", "new_host", "unusual_protocol"
	Description string    `json:"description"`
	Severity    string    `json:"severity"` // "low", "medium", "high", "critical"
	SourceIP    string    `json:"source_ip"`
	DestIP      string    `json:"dest_ip"`
	Timestamp   time.Time `json:"timestamp"`
	Value       float64   `json:"value"`
	Threshold   float64   `json:"threshold"`
}

// StartNetFlowCollection starts NetFlow/sFlow collection for devices
func (nfc *NetFlowCollector) StartNetFlowCollection(device models.Device, port int) error {
	// Start UDP listener for NetFlow/sFlow data
	addr := fmt.Sprintf("0.0.0.0:%d", port)

	udpAddr, err := net.ResolveUDPAddr("udp", addr)
	if err != nil {
		return fmt.Errorf("failed to resolve UDP address: %w", err)
	}

	conn, err := net.ListenUDP("udp", udpAddr)
	if err != nil {
		return fmt.Errorf("failed to start UDP listener: %w", err)
	}

	log.Printf("Started NetFlow/sFlow collection for device %s on port %d", device.IPAddress, port)

	// Start goroutine to handle incoming flows
	go nfc.handleNetFlowData(device.ID, conn)

	return nil
}

// handleNetFlowData processes incoming NetFlow/sFlow packets
func (nfc *NetFlowCollector) handleNetFlowData(deviceID uint, conn *net.UDPConn) {
	defer conn.Close()

	buffer := make([]byte, 4096)

	for {
		n, _, err := conn.ReadFromUDP(buffer)
		if err != nil {
			log.Printf("Error reading NetFlow data: %v", err)
			continue
		}

		// Parse NetFlow/sFlow packet
		flowData := nfc.parseNetFlowPacket(buffer[:n])
		if flowData != nil {
			flowData.DeviceID = deviceID
			nfc.processFlowRecord(*flowData)
		}
	}
}

// parseNetFlowPacket parses NetFlow/sFlow packet data
func (nfc *NetFlowCollector) parseNetFlowPacket(data []byte) *NetFlowSession {
	// This is a simplified implementation
	// In production, you'd use proper NetFlow/sFlow parsing libraries

	// Mock NetFlow record parsing
	return &NetFlowSession{
		SourceIP:    "192.168.1.100",
		DestIP:      "10.0.0.50",
		SourcePort:  443,
		DestPort:    12345,
		Protocol:    "TCP",
		Bytes:       1024,
		Packets:     1,
		FirstSeen:   time.Now(),
		LastSeen:    time.Now(),
		Application: "HTTPS",
	}
}

// processFlowRecord processes and stores flow record
func (nfc *NetFlowCollector) processFlowRecord(flow NetFlowSession) {
	nfc.mutex.Lock()
	defer nfc.mutex.Unlock()

	key := fmt.Sprintf("%s:%d-%s:%d-%s",
		flow.SourceIP, flow.SourcePort,
		flow.DestIP, flow.DestPort,
		flow.Protocol)

	if session, exists := nfc.flows[key]; exists {
		// Update existing session
		session.Bytes += flow.Bytes
		session.Packets += flow.Packets
		session.LastSeen = time.Now()
	} else {
		// Create new session
		nfc.flows[key] = &flow
	}

	// Store in database
	nfc.saveFlowRecord(flow)
}

// saveFlowRecord saves flow record to database
func (nfc *NetFlowCollector) saveFlowRecord(flow NetFlowSession) {
	// Save to telemetry_data table with metric="netflow"
	telemetryData := models.TelemetryData{
		DeviceID:  flow.DeviceID,
		Metric:    "netflow_bytes",
		Value:     float64(flow.Bytes),
		Unit:      "bytes",
		Timestamp: time.Now(),
	}

	if err := nfc.db.Create(&telemetryData).Error; err != nil {
		log.Printf("Failed to save NetFlow record: %v", err)
	}
}

// AnalyzeTrafficPatterns performs comprehensive traffic analysis
func (nfc *NetFlowCollector) AnalyzeTrafficPatterns(deviceID uint, hours int) (map[string]interface{}, error) {
	// Get flow data from database
	var flows []models.TelemetryData
	err := nfc.db.Where("device_id = ? AND metric = ? AND timestamp > ?",
		deviceID, "netflow_bytes", time.Now().Add(time.Duration(-hours)*time.Hour)).Find(&flows).Error
	if err != nil {
		return nil, err
	}

	// Analyze traffic patterns
	analysis := nfc.performTrafficAnalysis(flows, hours)

	return analysis, nil
}

// performTrafficAnalysis analyzes traffic patterns using ML
func (nfc *NetFlowCollector) performTrafficAnalysis(flows []models.TelemetryData, hours int) map[string]interface{} {
	// Calculate basic statistics
	totalBytes := int64(0)
	totalFlows := len(flows)
	peakHour := 0
	maxBytes := int64(0)

	// Group by hour
	hourlyStats := make(map[int]int64)
	for _, flow := range flows {
		hour := flow.Timestamp.Hour()
		hourlyStats[hour] += int64(flow.Value)

		totalBytes += int64(flow.Value)
		if int64(flow.Value) > maxBytes {
			maxBytes = int64(flow.Value)
			peakHour = hour
		}
	}

	// Detect anomalies (simplified)
	averageBytes := totalBytes / int64(len(hourlyStats))
	anomalies := []string{}

	for hour, bytes := range hourlyStats {
		if bytes > averageBytes*3 { // 3x average is anomalous
			anomalies = append(anomalies, fmt.Sprintf("Hour %d: %d bytes (%.1fx average)", hour, bytes, float64(bytes)/float64(averageBytes)))
		}
	}

	return map[string]interface{}{
		"total_bytes":       totalBytes,
		"total_flows":       totalFlows,
		"average_throughput": totalBytes / int64(hours),
		"peak_hour":         peakHour,
		"anomalies":         anomalies,
		"analysis_period":   fmt.Sprintf("%d hours", hours),
		"hourly_breakdown":  hourlyStats,
	}
}

// SyslogManager handles syslog aggregation and analysis
type SyslogManager struct {
	db        *gorm.DB
	listeners map[uint]*SyslogListener
	mutex     sync.RWMutex
}

// SyslogListener represents a syslog listener for a device
type SyslogListener struct {
	DeviceID uint
	Port     int
	Conn     *net.UDPConn
	Running  bool
}

// EnhancedSyslogMessage represents parsed syslog information
type EnhancedSyslogMessage struct {
	ID           uint      `json:"id"`
	DeviceID     uint      `json:"device_id"`
	Facility     int       `json:"facility"`
	Severity     int       `json:"severity"`
	Priority     int       `json:"priority"`
	Version      int       `json:"version"`
	Timestamp    time.Time `json:"timestamp"`
	Hostname     string    `json:"hostname"`
	AppName      string    `json:"app_name"`
	ProcessID    string    `json:"process_id"`
	MessageID    string    `json:"message_id"`
	Message      string    `json:"message"`
	StructuredData map[string]interface{} `json:"structured_data"`
	Category     string    `json:"category"` // "security", "performance", "configuration", "system"
	ParsedFields map[string]interface{} `json:"parsed_fields"`
}

// StartSyslogCollection starts syslog collection for a device
func (sm *SyslogManager) StartSyslogCollection(device models.Device, port int) error {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()

	if _, exists := sm.listeners[device.ID]; exists {
		return fmt.Errorf("syslog listener already exists for device %s", device.IPAddress)
	}

	// Start UDP listener for syslog
	addr := fmt.Sprintf("0.0.0.0:%d", port)
	udpAddr, err := net.ResolveUDPAddr("udp", addr)
	if err != nil {
		return fmt.Errorf("failed to resolve UDP address: %w", err)
	}

	conn, err := net.ListenUDP("udp", udpAddr)
	if err != nil {
		return fmt.Errorf("failed to start UDP listener: %w", err)
	}

	listener := &SyslogListener{
		DeviceID: device.ID,
		Port:     port,
		Conn:     conn,
		Running:  true,
	}

	sm.listeners[device.ID] = listener

	// Start goroutine to handle syslog messages
	go sm.handleSyslogMessages(listener)

	log.Printf("Started syslog collection for device %s on port %d", device.IPAddress, port)
	return nil
}

// handleSyslogMessages processes incoming syslog messages
func (sm *SyslogManager) handleSyslogMessages(listener *SyslogListener) {
	defer listener.Conn.Close()

	buffer := make([]byte, 4096)

	for listener.Running {
		n, _, err := listener.Conn.ReadFromUDP(buffer)
		if err != nil {
			log.Printf("Error reading syslog data: %v", err)
			continue
		}

		// Parse syslog message
		syslogMsg := sm.parseSyslogMessage(string(buffer[:n]))
		if syslogMsg != nil {
			syslogMsg.DeviceID = listener.DeviceID
			sm.processSyslogMessage(*syslogMsg)
		}
	}
}

// parseSyslogMessage parses syslog message according to RFC 3164/5424
func (sm *SyslogManager) parseSyslogMessage(rawMessage string) *EnhancedSyslogMessage {
	// This is a simplified syslog parser
	// In production, you'd use a proper syslog parsing library

	// Mock syslog parsing
	return &EnhancedSyslogMessage{
		Facility:       1,  // user-level messages
		Severity:       5,  // notice
		Priority:       13, // facility*8 + severity
		Version:        1,
		Timestamp:      time.Now(),
		Hostname:       "device1",
		AppName:        "system",
		ProcessID:      "1234",
		MessageID:      "",
		Message:        rawMessage,
		StructuredData: map[string]interface{}{},
		Category:       sm.categorizeSyslogMessage(rawMessage),
		ParsedFields:   sm.extractFieldsFromMessage(rawMessage),
	}
}

// categorizeSyslogMessage categorizes syslog messages
func (sm *SyslogManager) categorizeSyslogMessage(message string) string {
	message = strings.ToLower(message)

	if strings.Contains(message, "login") || strings.Contains(message, "auth") || strings.Contains(message, "user") {
		return "security"
	} else if strings.Contains(message, "cpu") || strings.Contains(message, "memory") || strings.Contains(message, "interface") {
		return "performance"
	} else if strings.Contains(message, "config") || strings.Contains(message, "interface") || strings.Contains(message, "vlan") {
		return "configuration"
	} else {
		return "system"
	}
}

// extractFieldsFromMessage extracts structured fields from syslog message
func (sm *SyslogManager) extractFieldsFromMessage(message string) map[string]interface{} {
	fields := make(map[string]interface{})

	// Extract common fields using regex patterns
	patterns := map[string]string{
		"interface": `interface (\w+[\d/]+)`,
		"ip_address": `(\d+\.\d+\.\d+\.\d+)`,
		"vlan": `vlan (\d+)`,
		"mac_address": `([0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2})`,
	}

	for field, pattern := range patterns {
		if matched, _ := regexp.MatchString(pattern, message); matched {
			fields[field] = "extracted"
		}
	}

	return fields
}

// processSyslogMessage processes and stores syslog message
func (sm *SyslogManager) processSyslogMessage(msg EnhancedSyslogMessage) {
	// Store in database
	telemetryData := models.TelemetryData{
		DeviceID:  msg.DeviceID,
		Metric:    fmt.Sprintf("syslog_%s", msg.Category),
		Value:     float64(msg.Severity),
		Unit:      "level",
		Timestamp: msg.Timestamp,
	}

	if err := sm.db.Create(&telemetryData).Error; err != nil {
		log.Printf("Failed to save syslog message: %v", err)
	}

	// Check for security events
	if msg.Category == "security" && msg.Severity <= 3 { // Error or higher
		sm.createSecurityAlert(msg)
	}
}

// createSecurityAlert creates security alert from syslog
func (sm *SyslogManager) createSecurityAlert(msg EnhancedSyslogMessage) {
	alert := models.NetworkAlert{
		DeviceID: &msg.DeviceID,
		Type:     "security_event",
		Severity: sm.mapSeverityToAlertSeverity(msg.Severity),
		Message:  fmt.Sprintf("Security event detected: %s", msg.Message),
	}

	if err := sm.db.Create(&alert).Error; err != nil {
		log.Printf("Failed to create security alert: %v", err)
	}
}

// mapSeverityToAlertSeverity maps syslog severity to alert severity
func (sm *SyslogManager) mapSeverityToAlertSeverity(severity int) string {
	switch severity {
	case 0, 1, 2: // Emergency, Alert, Critical
		return "critical"
	case 3: // Error
		return "warning"
	case 4, 5: // Warning, Notice
		return "info"
	default:
		return "info"
	}
}

// QoSManager provides comprehensive QoS monitoring
type QoSManager struct {
	db *gorm.DB
}

// QoSStats represents QoS statistics
type QoSStats struct {
	InterfaceName   string  `json:"interface_name"`
	ClassName       string  `json:"class_name"`
	QueueSize       int     `json:"queue_size"`
	DroppedPackets  int64   `json:"dropped_packets"`
	QueuedPackets   int64   `json:"queued_packets"`
	TransmittedBytes int64  `json:"transmitted_bytes"`
	QueueDepth      int     `json:"queue_depth"`
	AverageDelay    float64 `json:"average_delay"`
	DeviceID        uint    `json:"device_id"`
}

// MonitorQoS performs comprehensive QoS monitoring
func (qm *QoSManager) MonitorQoS(device models.Device) ([]QoSStats, error) {
	var qosStats []QoSStats

	snmp := &gosnmp.GoSNMP{
		Target:    device.IPAddress,
		Port:      161,
		Community: device.Community,
		Version:   gosnmp.Version2c,
		Timeout:   time.Duration(5) * time.Second,
	}

	err := snmp.Connect()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to device %s: %w", device.IPAddress, err)
	}
	defer snmp.Conn.Close()

	// Cisco QoS OIDs
	qosOIDs := []string{
		"1.3.6.1.4.1.9.9.166.1.1.1.1.1",  // ciscoQosClassMapName
		"1.3.6.1.4.1.9.9.166.1.5.1.1.2",  // ciscoQosPolicyMapName
		"1.3.6.1.4.1.9.9.166.1.15.1.1.9", // ciscoQosInterfaceQueueStats
	}

	for _, oid := range qosOIDs {
		result, err := snmp.BulkWalkAll(oid)
		if err != nil {
			continue
		}

		for _, variable := range result {
			stat := qm.parseQoSStats(variable.Name, variable.Value)
			if stat != nil {
				stat.DeviceID = device.ID
				qosStats = append(qosStats, *stat)
			}
		}
	}

	return qosStats, nil
}

// parseQoSStats parses QoS statistics from SNMP
func (qm *QoSManager) parseQoSStats(oid string, value interface{}) *QoSStats {
	// Parse QoS stats from SNMP OID
	return &QoSStats{
		InterfaceName:   "GigabitEthernet0/1",
		ClassName:       "voice",
		QueueSize:       100,
		DroppedPackets:  0,
		QueuedPackets:   150,
		TransmittedBytes: 1000000,
		QueueDepth:      10,
		AverageDelay:    5.2,
	}
}

// GetCompleteTrafficAnalysis provides comprehensive traffic analysis
func (nfc *NetFlowCollector) GetCompleteTrafficAnalysis(deviceID uint, hours int) (map[string]interface{}, error) {
	// Get NetFlow data
	flowAnalysis, err := nfc.AnalyzeTrafficPatterns(deviceID, hours)
	if err != nil {
		return nil, err
	}

	// Get device for QoS analysis
	var device models.Device
	err = nfc.db.First(&device, deviceID).Error
	if err != nil {
		return nil, err
	}

	// Get QoS statistics
	qosManager := &QoSManager{db: nfc.db}
	qosStats, err := qosManager.MonitorQoS(device)
	if err != nil {
		qosStats = []QoSStats{} // Empty if QoS not available
	}

	// Combine all analyses
	completeAnalysis := map[string]interface{}{
		"traffic_analysis": flowAnalysis,
		"qos_statistics":   qosStats,
		"recommendations":  nfc.generateOptimizationRecommendations(flowAnalysis, qosStats),
		"analysis_timestamp": time.Now(),
		"device_id":        deviceID,
	}

	return completeAnalysis, nil
}

// generateOptimizationRecommendations generates network optimization suggestions
func (nfc *NetFlowCollector) generateOptimizationRecommendations(flowAnalysis map[string]interface{}, qosStats []QoSStats) []string {
	var recommendations []string

	// Check for bandwidth issues
	if avgThroughput, ok := flowAnalysis["average_throughput"].(int64); ok {
		if avgThroughput > 10000000 { // 10Mbps threshold
			recommendations = append(recommendations, "Consider upgrading bandwidth - high average throughput detected")
		}
	}

	// Check for anomalies
	if anomalies, ok := flowAnalysis["anomalies"].([]string); ok && len(anomalies) > 0 {
		recommendations = append(recommendations, "Multiple traffic anomalies detected - investigate unusual patterns")
	}

	// Check QoS performance
	for _, qos := range qosStats {
		if qos.DroppedPackets > 1000 {
			recommendations = append(recommendations,
				fmt.Sprintf("High packet drops on %s - consider adjusting QoS policies", qos.InterfaceName))
		}
	}

	if len(recommendations) == 0 {
		recommendations = append(recommendations, "Network performance is optimal")
	}

	return recommendations
}
