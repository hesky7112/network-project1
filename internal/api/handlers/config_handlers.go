package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ListBackups returns all config backups
func (h *APIHandlers) ListBackups(c *gin.Context) {
	backups, err := h.configService.ListBackups(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, backups)
}

// CreateBackup creates a new backup (triggers backup from device)
func (h *APIHandlers) CreateBackup(c *gin.Context) {
	if err := h.configService.CreateBackup(c); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Backup created successfully"})
}

// RestoreConfig restores a specific backup to a device
func (h *APIHandlers) RestoreConfig(c *gin.Context) {
	deviceID := c.Param("id")
	if err := h.configService.RestoreConfig(c, deviceID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Config restore initiated"})
}

// CompareConfigs compares running config with latest backup
func (h *APIHandlers) CompareConfigs(c *gin.Context) {
	deviceID := c.Param("id")
	diff, err := h.configService.CompareConfigs(c, deviceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"diff": diff})
}
