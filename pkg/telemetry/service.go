package telemetry

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"networking-main/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
	"github.com/gosnmp/gosnmp"
	"gorm.io/gorm"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow for demo
	},
}

type Service struct {
	db                *gorm.DB
	redis             *redis.Client
	collector         *TelemetryCollector
	netFlowCollector  *NetFlowCollector
	syslogManager     *SyslogManager
	qosManager        *QoSManager
	trapReceiver      *TrapReceiver
	routingCollector  *RoutingCollector
	bandwidthAnalyzer *BandwidthAnalyzer
	QoSVisualizer     *QoSVisualizer
}

type TelemetryCollector struct {
	db           *gorm.DB
	redis        *redis.Client
	snmpClients  map[string]*gosnmp.GoSNMP
	pollingMutex sync.RWMutex
	stopChan     chan bool
}

func NewService(db *gorm.DB, redis *redis.Client) *Service {
	// Circular dependency injection
	svc := &Service{
		db:    db,
		redis: redis,
		collector: &TelemetryCollector{
			db:          db,
			redis:       redis,
			snmpClients: make(map[string]*gosnmp.GoSNMP),
			stopChan:    make(chan bool),
		},
		netFlowCollector: &NetFlowCollector{
			db:        db,
			flows:     make(map[string]*NetFlowSession),
			analyzers: make(map[string]*TrafficAnalyzer),
		},
		syslogManager: &SyslogManager{
			db:        db,
			listeners: make(map[uint]*SyslogListener),
		},
		qosManager:        &QoSManager{db: db},
		QoSVisualizer:     NewQoSVisualizer(db),
		trapReceiver:      NewTrapReceiver(nil, "0.0.0.0:162"),
		routingCollector:  NewRoutingCollector(db),
		bandwidthAnalyzer: NewBandwidthAnalyzer(db),
	}
	svc.trapReceiver.service = svc
	return svc
}

func (s *Service) CheckRoutingHealth(deviceID uint) error {
	var device models.Device
	err := s.db.First(&device, deviceID).Error
	if err != nil {
		return err
	}
	// We need the SNMP client here.
	// For simplicity, we can let collector expose it or reuse the logic.
	// But collector logic is private.
	// Reuse getSNMPClient logic or let collector handle it?
	// Better: delegate to collector to get client, then pass to routing collector.
	// Or implementation in RoutingCollector handles connection itself?
	// The current implementation expects a *gosnmp.GoSNMP client passed in.

	// Let's use a temporary client for now to avoid complexity with reusing collector's cache which is private
	// In production, expose collector's client getter.
	client := &gosnmp.GoSNMP{
		Target:    device.IPAddress,
		Port:      161,
		Community: device.Community,
		Version:   gosnmp.Version2c,
		Timeout:   time.Duration(2) * time.Second,
	}
	if err := client.Connect(); err != nil {
		return err
	}
	defer client.Conn.Close()

	return s.routingCollector.CheckRoutingHealth(device, client)
}

func (s *Service) CheckAllRoutingHealth(ctx context.Context) error {
	var devices []models.Device
	s.db.Find(&devices)
	for _, dev := range devices {
		if err := s.CheckRoutingHealth(dev.ID); err != nil {
			log.Printf("Routing check failed for %s: %v", dev.Hostname, err)
		}
	}
	return nil
}

func (s *Service) GetBandwidthAnalytics(deviceID uint, iface string, start, end time.Time) (*BandwidthUsage, error) {
	return s.bandwidthAnalyzer.CalculateUsage(deviceID, iface, start, end)
}

func (s *Service) GetLiveMetrics(c *gin.Context) ([]models.TelemetryData, error) {
	var metrics []models.TelemetryData
	err := s.db.Order("timestamp desc").Limit(100).Find(&metrics).Error
	return metrics, err
}

func (s *Service) GetHistoricalMetrics(c *gin.Context, deviceID string) ([]models.TelemetryData, error) {
	var metrics []models.TelemetryData
	err := s.db.Where("device_id = ?", deviceID).Order("timestamp desc").Find(&metrics).Error
	return metrics, err
}

func (s *Service) GetAlerts(c *gin.Context) ([]models.NetworkAlert, error) {
	var alerts []models.NetworkAlert
	err := s.db.Where("resolved = ?", false).Order("created_at desc").Find(&alerts).Error
	return alerts, err
}

func (s *Service) TelemetryWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade telemetry websocket: %v", err)
		return
	}
	defer conn.Close()

	// Optional: Get device ID from query
	deviceID := c.Query("did")

	ctx := c.Request.Context()
	var pubsub *redis.PubSub

	if deviceID != "" {
		// Subscribe to specific device channel
		channel := fmt.Sprintf("device:%s:metrics", deviceID)
		pubsub = s.redis.Subscribe(ctx, channel)
	} else {
		// Subscribe to all metric channels
		// In production, might want a dedicated 'global' channel for efficiency
		pubsub = s.redis.PSubscribe(ctx, "device:*:metrics")
	}
	defer pubsub.Close()

	// Channel to receive messages
	ch := pubsub.Channel()

	log.Printf("Telemetry WebSocket connected (Device: %s)", deviceID)

	for {
		select {
		case <-ctx.Done():
			return
		case msg := <-ch:
			if err := conn.WriteMessage(websocket.TextMessage, []byte(msg.Payload)); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}
		}
	}
}

// StartSNMPPolling begins continuous SNMP polling for all devices
func (s *Service) StartSNMPPolling() error {
	return s.collector.StartSNMPPolling()
}

// StopSNMPPolling stops all polling goroutines
func (s *Service) StopSNMPPolling() {
	s.collector.StopSNMPPolling()
}

// GetDeviceMetrics retrieves current metrics for a specific device
func (s *Service) GetDeviceMetrics(deviceID uint) (map[string]float64, error) {
	var metrics []models.TelemetryData
	err := s.db.Where("device_id = ? AND timestamp > ?",
		deviceID, time.Now().Add(-10*time.Minute)).Find(&metrics).Error
	if err != nil {
		return nil, err
	}

	result := make(map[string]float64)
	for _, metric := range metrics {
		result[metric.Metric] = metric.Value
	}

	return result, nil
}

// Advanced monitoring methods
func (s *Service) StartNetFlowCollection(deviceID uint, port int) error {
	var device models.Device
	err := s.db.First(&device, deviceID).Error
	if err != nil {
		return err
	}

	return s.netFlowCollector.StartNetFlowCollection(device, port)
}

func (s *Service) AnalyzeTraffic(deviceID uint, hours int) (map[string]interface{}, error) {
	return s.netFlowCollector.AnalyzeTrafficPatterns(deviceID, hours)
}

func (s *Service) GetCompleteAnalysis(deviceID uint, hours int) (map[string]interface{}, error) {
	return s.netFlowCollector.GetCompleteTrafficAnalysis(deviceID, hours)
}

func (s *Service) StartSyslogCollection(deviceID uint, port int) error {
	var device models.Device
	err := s.db.First(&device, deviceID).Error
	if err != nil {
		return err
	}

	return s.syslogManager.StartSyslogCollection(device, port)
}

func (s *Service) GetQoSStats(deviceID uint) ([]QoSStats, error) {
	var device models.Device
	err := s.db.First(&device, deviceID).Error
	if err != nil {
		return nil, err
	}

	return s.qosManager.MonitorQoS(device)
}

func (s *Service) StartTrapReceiver() error {
	return s.trapReceiver.Start()
}

// SNMP Collector Implementation
func (tc *TelemetryCollector) StartSNMPPolling() error {
	// Get all devices from database
	var devices []models.Device
	if err := tc.db.Find(&devices).Error; err != nil {
		return fmt.Errorf("failed to get devices: %w", err)
	}

	log.Printf("Starting SNMP polling for %d devices", len(devices))

	// Start polling goroutine for each device
	for _, device := range devices {
		go tc.pollDevice(device)
	}

	// Start alert checking
	go tc.checkAlerts()

	return nil
}

// pollDevice continuously polls a single device for SNMP metrics
func (tc *TelemetryCollector) pollDevice(device models.Device) {
	ticker := time.NewTicker(30 * time.Second) // Poll every 30 seconds
	defer ticker.Stop()

	for {
		select {
		case <-tc.stopChan:
			return
		case <-ticker.C:
			tc.collectDeviceMetrics(device)
		}
	}
}

// collectDeviceMetrics gathers all SNMP metrics for a device
func (tc *TelemetryCollector) collectDeviceMetrics(device models.Device) {
	if device.Community == "" {
		device.Community = "public" // Default community
	}

	client := tc.getSNMPClient(device.IPAddress, device.Community, device.SNMPVersion)

	metrics := []struct {
		oid  string
		name string
		unit string
	}{
		// System metrics
		{"1.3.6.1.2.1.1.3.0", "sys_uptime", "seconds"},
		{"1.3.6.1.2.1.1.5.0", "sys_name", "string"},

		// CPU metrics
		{"1.3.6.1.2.1.25.3.3.1.2.1", "cpu_usage", "percent"}, // Host resources CPU

		// Memory metrics
		{"1.3.6.1.2.1.25.2.3.1.5.1", "memory_used", "bytes"}, // Host resources memory used
		{"1.3.6.1.2.1.25.2.3.1.6.1", "memory_free", "bytes"}, // Host resources memory free

		// Interface metrics (example for interface 1)
		{"1.3.6.1.2.1.2.2.1.10.1", "interface_in_octets", "bytes"},  // ifInOctets
		{"1.3.6.1.2.1.2.2.1.16.1", "interface_out_octets", "bytes"}, // ifOutOctets
		{"1.3.6.1.2.1.2.2.1.14.1", "interface_in_errors", "count"},  // ifInErrors
		{"1.3.6.1.2.1.2.2.1.20.1", "interface_out_errors", "count"}, // ifOutErrors
		{"1.3.6.1.2.1.2.2.1.5.1", "interface_speed", "bps"},         // ifSpeed
		{"1.3.6.1.2.1.2.2.1.8.1", "interface_status", "status"},     // ifOperStatus
	}

	var wg sync.WaitGroup
	metricChan := make(chan MetricValue, len(metrics))

	// Collect all metrics concurrently
	for _, metric := range metrics {
		wg.Add(1)
		go func(m struct {
			oid  string
			name string
			unit string
		}) {
			defer wg.Done()

			value, err := tc.snmpGet(client, m.oid)
			if err != nil {
				log.Printf("Failed to get SNMP metric %s for device %s: %v", m.name, device.IPAddress, err)
				return
			}

			metricValue := MetricValue{
				DeviceID:   device.ID,
				MetricName: m.name,
				Value:      tc.convertSNMPValue(value, m.unit),
				Unit:       m.unit,
				Timestamp:  time.Now(),
				RawValue:   value,
			}

			metricChan <- metricValue
		}(metric)
	}

	// Close channel when all workers are done
	go func() {
		wg.Wait()
		close(metricChan)
	}()

	// Save all collected metrics
	for metric := range metricChan {
		tc.saveMetric(metric)
		tc.publishToRedis(metric)
	}

	// Update device last seen
	tc.db.Model(&device).Update("last_seen", time.Now())
}

// snmpGet performs SNMP GET operation
func (tc *TelemetryCollector) snmpGet(client *gosnmp.GoSNMP, oid string) (interface{}, error) {
	result, err := client.Get([]string{oid})
	if err != nil {
		return nil, err
	}

	if len(result.Variables) == 0 {
		return nil, fmt.Errorf("no SNMP response")
	}

	return result.Variables[0].Value, nil
}

// getSNMPClient returns or creates SNMP client for device
func (tc *TelemetryCollector) getSNMPClient(ip, community, snmpVersion string) *gosnmp.GoSNMP {
	tc.pollingMutex.Lock()
	defer tc.pollingMutex.Unlock()

	key := fmt.Sprintf("%s:%s:%s", ip, community, snmpVersion)

	if client, exists := tc.snmpClients[key]; exists {
		return client
	}

	version := gosnmp.Version2c
	if snmpVersion == "v1" {
		version = gosnmp.Version1
	} else if snmpVersion == "v3" {
		version = gosnmp.Version3
	}

	client := &gosnmp.GoSNMP{
		Target:    ip,
		Port:      161,
		Community: community,
		Version:   version,
		Timeout:   time.Duration(5) * time.Second,
		Retries:   3,
	}

	tc.snmpClients[key] = client
	return client
}

// convertSNMPValue converts SNMP value to float64
func (tc *TelemetryCollector) convertSNMPValue(value interface{}, unit string) float64 {
	switch v := value.(type) {
	case int:
		return float64(v)
	case int8:
		return float64(v)
	case int16:
		return float64(v)
	case int32:
		return float64(v)
	case int64:
		return float64(v)
	case uint:
		return float64(v)
	case uint8:
		return float64(v)
	case uint16:
		return float64(v)
	case uint32:
		return float64(v)
	case uint64:
		return float64(v)
	case float32:
		return float64(v)
	case float64:
		return v
	case string:
		// For status values, convert to numeric
		if unit == "status" {
			if v == "up" || v == "1" {
				return 1.0
			}
			return 0.0
		}
		// Try to parse as number
		var parsed float64
		if _, err := fmt.Sscanf(v, "%f", &parsed); err == nil {
			return parsed
		}
		return 0.0
	default:
		return 0.0
	}
}

// saveMetric saves metric to database
func (tc *TelemetryCollector) saveMetric(metric MetricValue) {
	telemetryData := models.TelemetryData{
		DeviceID:  metric.DeviceID,
		Metric:    metric.MetricName,
		Value:     metric.Value,
		Unit:      metric.Unit,
		Timestamp: metric.Timestamp,
	}

	if err := tc.db.Create(&telemetryData).Error; err != nil {
		log.Printf("Failed to save metric %s for device %d: %v", metric.MetricName, metric.DeviceID, err)
	}
}

// publishToRedis publishes metric to Redis for real-time consumption
func (tc *TelemetryCollector) publishToRedis(metric MetricValue) {
	key := fmt.Sprintf("telemetry:device:%d", metric.DeviceID)

	data := map[string]interface{}{
		"metric":    metric.MetricName,
		"value":     metric.Value,
		"unit":      metric.Unit,
		"timestamp": metric.Timestamp.Unix(),
	}

	ctx := context.Background()
	if err := tc.redis.HSet(ctx, key, data).Err(); err != nil {
		log.Printf("Failed to publish metric to Redis: %v", err)
	}

	// Publish to device-specific channel for WebSocket clients
	channel := fmt.Sprintf("device:%d:metrics", metric.DeviceID)
	tc.redis.Publish(ctx, channel, data)
}

// checkAlerts evaluates metrics against alert thresholds
func (tc *TelemetryCollector) checkAlerts() {
	ticker := time.NewTicker(60 * time.Second) // Check every minute
	defer ticker.Stop()

	for {
		select {
		case <-tc.stopChan:
			return
		case <-ticker.C:
			tc.evaluateAlertRules()
		}
	}
}

// evaluateAlertRules checks all metrics against configured alert rules
func (tc *TelemetryCollector) evaluateAlertRules() {
	// Get recent metrics for all devices
	var recentMetrics []models.TelemetryData
	if err := tc.db.Where("timestamp > ?", time.Now().Add(-5*time.Minute)).Find(&recentMetrics).Error; err != nil {
		log.Printf("Failed to get recent metrics for alert checking: %v", err)
		return
	}

	// Group metrics by device
	metricsByDevice := make(map[uint][]models.TelemetryData)
	for _, metric := range recentMetrics {
		metricsByDevice[metric.DeviceID] = append(metricsByDevice[metric.DeviceID], metric)
	}

	// Check each device against default alert rules
	for deviceID, metrics := range metricsByDevice {
		tc.checkDeviceAlerts(deviceID, metrics)
	}
}

// checkDeviceAlerts evaluates alert rules for a specific device
func (tc *TelemetryCollector) checkDeviceAlerts(deviceID uint, metrics []models.TelemetryData) {
	// Create metric lookup map
	metricMap := make(map[string]float64)
	for _, metric := range metrics {
		metricMap[metric.Metric] = metric.Value
	}

	// Default alert rules
	alertRules := []AlertConfig{
		{MetricName: "cpu_usage", Operator: "gt", Threshold: 80.0, Severity: "warning", Description: "High CPU usage"},
		{MetricName: "cpu_usage", Operator: "gt", Threshold: 95.0, Severity: "critical", Description: "Critical CPU usage"},
		{MetricName: "memory_used", Operator: "gt", Threshold: 85.0, Severity: "warning", Description: "High memory usage"},
		{MetricName: "interface_in_errors", Operator: "gt", Threshold: 100.0, Severity: "warning", Description: "Interface input errors"},
		{MetricName: "interface_out_errors", Operator: "gt", Threshold: 100.0, Severity: "warning", Description: "Interface output errors"},
	}

	for _, rule := range alertRules {
		value, exists := metricMap[rule.MetricName]
		if !exists {
			continue
		}

		triggered := false
		switch rule.Operator {
		case "gt":
			triggered = value > rule.Threshold
		case "lt":
			triggered = value < rule.Threshold
		case "eq":
			triggered = value == rule.Threshold
		}

		if triggered {
			tc.createAlert(deviceID, rule, value)
		}
	}
}

// createAlert creates a new alert in the database
func (tc *TelemetryCollector) createAlert(deviceID uint, rule AlertConfig, currentValue float64) {
	alert := models.NetworkAlert{
		DeviceID: &deviceID,
		Type:     "threshold_exceeded",
		Severity: rule.Severity,
		Message:  fmt.Sprintf("%s: %s is %.2f (threshold: %.2f)", rule.Description, rule.MetricName, currentValue, rule.Threshold),
	}

	// Check if similar alert already exists and is not resolved
	var existingAlert models.NetworkAlert
	err := tc.db.Where("device_id = ? AND type = ? AND severity = ? AND resolved = ?",
		deviceID, alert.Type, alert.Severity, false).First(&existingAlert).Error

	if err == gorm.ErrRecordNotFound {
		// Create new alert
		if err := tc.db.Create(&alert).Error; err != nil {
			log.Printf("Failed to create alert: %v", err)
		} else {
			log.Printf("Created alert: %s", alert.Message)
		}
	}
}

// StopSNMPPolling stops all polling goroutines
func (tc *TelemetryCollector) StopSNMPPolling() {
	close(tc.stopChan)
	log.Println("SNMP polling stopped")
}

type MetricValue struct {
	DeviceID   uint
	MetricName string
	Value      float64
	Unit       string
	Timestamp  time.Time
	RawValue   interface{}
}

type AlertConfig struct {
	MetricName  string
	Operator    string // "gt", "lt", "eq"
	Threshold   float64
	Severity    string
	Description string
}
