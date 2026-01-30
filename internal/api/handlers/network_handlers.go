package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	models "networking-main/internal/models"
	"networking-main/pkg/netconfig"

	"github.com/gin-gonic/gin"
)

// GetNetworkAlerts returns recent SNMP traps and alerts
func (h *APIHandlers) GetNetworkAlerts(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	alerts, err := h.SNMP.GetRecentAlerts(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, alerts)
}

// GetNetworkFlows returns raw or aggregated flow logs
func (h *APIHandlers) GetNetworkFlows(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	// For now, return top talkers as a proxy for "flows" in the dashboard
	// Or specifically expose Top Talkers
	talkers, err := h.NetFlow.GetTopTalkers(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, talkers)
}

// GetTrafficStats returns aggregated traffic statistics
func (h *APIHandlers) GetTrafficStats(c *gin.Context) {
	// This would query the TrafficStats table populated by the Aggregator
	// Implementing a simple query via DB handle for now as NetFlow.Collector doesn't expose it directly yet
	// In a real refactor, we'd add GetStats() to the Collector interface
	type StatResult struct {
		App   string `json:"app"`
		Bytes int64  `json:"bytes"`
	}
	var results []StatResult

	// Aggregate by App for the last 24h
	err := h.DB.Table("traffic_stats").
		Select("app, sum(bytes) as bytes").
		Where("time_win > ?", time.Now().Add(-24*time.Hour)).
		Group("app").
		Order("bytes desc").
		Scan(&results).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, results)
}

// GetDriftReport returns configuration drift detected on devices
func (h *APIHandlers) GetDriftReport(c *gin.Context) {
	// Query for active drift alerts or a specific Drift Report table
	// For MPV, we query the ConfigDrift table or NetworkAlerts of type 'config_drift'
	type DriftSummary struct {
		DeviceID   uint      `json:"device_id"`
		DeviceName string    `json:"device_name"`
		DetectedAt time.Time `json:"detected_at"`
		Severity   string    `json:"severity"`
	}

	var drifts []DriftSummary
	// Assuming NetworkAlerts store this info as per compliance.go logic
	err := h.DB.Table("network_alerts").
		Select("device_id, message as device_name, created_at as detected_at, severity"). // Message contains hostname? simplified
		Where("type = ?", "config_drift").
		Order("created_at desc").
		Limit(20).
		Scan(&drifts).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, drifts)
}

// RunDriftCheck triggers an immediate compliance check
func (h *APIHandlers) RunDriftCheck(c *gin.Context) {
	// Trigger the scheduler job manually
	err := h.Scheduler.TriggerTask("compliance-check")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Drift check initiated"})
}

// GetDeviceParsedStats retrieves structured data from a device command (e.g., show version)
func (h *APIHandlers) GetDeviceParsedStats(c *gin.Context) {
	deviceIDStr := c.Param("id")
	command := c.Query("command")
	if command == "" {
		command = "show version" // default
	}

	deviceID, _ := strconv.ParseUint(deviceIDStr, 10, 32)
	var device models.Device
	if err := h.DB.First(&device, uint(deviceID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	// 1. Get raw output (Using RunCommand which handles Real vs Mock)
	output, err := h.configService.RunCommand(device, command)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 2. Get Driver and Parse
	driver, err := netconfig.GetDriver(device.DeviceType)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsed, err := driver.ParseOutput(command, output)
	if err != nil {
		// If parsing fails (e.g. no template), return raw output but with a warning
		c.JSON(http.StatusOK, gin.H{
			"raw":     output,
			"warning": fmt.Sprintf("Parsing failed: %v", err),
		})
		return
	}

	// 3. Search for related historical intelligence
	related := h.Neural.FindRelatedEvents(output, 3)

	c.JSON(http.StatusOK, gin.H{
		"command":              command,
		"parsed":               parsed,
		"related_intelligence": related,
	})
}
