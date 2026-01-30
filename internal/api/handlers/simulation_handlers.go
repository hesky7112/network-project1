package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetSimulationTopology returns the current virtual network state
func (h *APIHandlers) GetSimulationTopology(c *gin.Context) {
	nodes, links, err := h.Simulation.GetTopology()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"nodes": nodes,
		"links": links,
	})
}

// InjectSimulationFailure handles failure injection requests
func (h *APIHandlers) InjectSimulationFailure(c *gin.Context) {
	var req struct {
		TargetID string `json:"target_id" binding:"required"`
		Type     string `json:"type" binding:"required"` // "down", "cut"
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Simulation.InjectFailure(req.TargetID, req.Type); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Failure injected successfully"})
}

// RestoreSimulationComponent handles recovery requests
func (h *APIHandlers) RestoreSimulationComponent(c *gin.Context) {
	var req struct {
		TargetID string `json:"target_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Simulation.Restore(req.TargetID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Component restored"})
}

// SimulatePing handles ping requests between virtual nodes
func (h *APIHandlers) SimulatePing(c *gin.Context) {
	var req struct {
		SourceID string `json:"source_id" binding:"required"`
		TargetID string `json:"target_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.Simulation.RunPing(req.SourceID, req.TargetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}
