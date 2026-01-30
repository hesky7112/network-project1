package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetLiveMetrics returns the latest metrics
func (h *APIHandlers) GetLiveMetrics(c *gin.Context) {
	metrics, err := h.telemetryService.GetLiveMetrics(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, metrics)
}

// GetHistoricalMetrics returns historical metrics for a device
func (h *APIHandlers) GetHistoricalMetrics(c *gin.Context) {
	deviceID := c.Param("id")
	metrics, err := h.telemetryService.GetHistoricalMetrics(c, deviceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, metrics)
}

// GetAlerts returns active alerts
func (h *APIHandlers) GetAlerts(c *gin.Context) {
	alerts, err := h.telemetryService.GetAlerts(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, alerts)
}

// GetDeviceMetrics returns specific metrics for a device
func (h *APIHandlers) GetDeviceMetrics(c *gin.Context) {
	deviceID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	metrics, err := h.telemetryService.GetDeviceMetrics(uint(deviceID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, metrics)
}

// TelemetryWebSocket handles real-time telemetry streaming
func (h *APIHandlers) TelemetryWebSocket(c *gin.Context) {
	h.telemetryService.TelemetryWebSocket(c)
}
