package handlers

import (
	"context"
	"net/http"
	"strconv"

	"networking-main/internal/models"

	"github.com/gin-gonic/gin"
)

// GetRemediationSuggestion returns a neural suggestion for a specific alert
func (h *APIHandlers) GetRemediationSuggestion(c *gin.Context) {
	alertIDStr := c.Param("id")
	alertID, _ := strconv.ParseUint(alertIDStr, 10, 32)

	var alert models.NetworkAlert
	if err := h.DB.First(&alert, uint(alertID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Alert not found"})
		return
	}

	advice, err := h.Neural.GetRemediationAdvice(alert.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if advice == nil {
		c.JSON(http.StatusOK, gin.H{
			"message":    "No specific neural fix found for this pattern.",
			"suggestion": nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"alert_id":   alertID,
		"suggestion": advice,
		"confidence": advice.Score,
	})
}

// ApplyRemediation executes the suggested fix for an alert
func (h *APIHandlers) ApplyRemediation(c *gin.Context) {
	alertIDStr := c.Param("id")
	alertID, _ := strconv.ParseUint(alertIDStr, 10, 32)

	var alert models.NetworkAlert
	if err := h.DB.First(&alert, uint(alertID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Alert not found"})
		return
	}

	// Trigger the remediation engine
	result, err := h.aiopsService.RemediationEngine.EvaluateAlert(context.Background(), alert)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if result == nil {
		c.JSON(http.StatusOK, gin.H{"message": "No matching playbook found for this alert."})
		return
	}

	c.JSON(http.StatusOK, result)
}
