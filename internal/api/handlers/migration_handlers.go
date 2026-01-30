package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *APIHandlers) StartMigration(c *gin.Context) {
	var req struct {
		SourceType string                 `json:"source_type" binding:"required"`
		Config     map[string]interface{} `json:"config"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	jobID, err := h.migrationService.StartMigration(c.Request.Context(), req.SourceType, req.Config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job_id":  jobID,
		"message": "Migration initiated in Go backend 🛸",
	})
}

func (h *APIHandlers) GetMigrationStatus(c *gin.Context) {
	jobID := c.Param("id")
	status, ok := h.migrationService.GetJobStatus(jobID)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "Migration job not found"})
		return
	}

	c.JSON(http.StatusOK, status)
}
