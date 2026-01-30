package handlers

import (
	"net/http"
	models "networking-main/internal/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetDevices returns all devices
func (h *APIHandlers) GetDevices(c *gin.Context) {
	devices, err := h.inventoryService.ListDevices(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, devices)
}

// GetDevice returns a single device
func (h *APIHandlers) GetDevice(c *gin.Context) {
	id := c.Param("id")
	device, err := h.inventoryService.GetDevice(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}
	c.JSON(http.StatusOK, device)
}

// CreateDevice creates a new device
func (h *APIHandlers) CreateDevice(c *gin.Context) {
	var device models.Device
	if err := c.ShouldBindJSON(&device); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.inventoryService.CreateDevice(c, device); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, device)
}

// UpdateDevice updates a device
func (h *APIHandlers) UpdateDevice(c *gin.Context) {
	id := c.Param("id")
	var device models.Device
	if err := c.ShouldBindJSON(&device); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.inventoryService.UpdateDevice(c, id, device); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Device updated successfully"})
}

// DeleteDevice deletes a device
func (h *APIHandlers) DeleteDevice(c *gin.Context) {
	id := c.Param("id")
	if err := h.inventoryService.DeleteDevice(c, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Device deleted successfully"})
}

// RunCommand executes a custom SSH command on a device
func (h *APIHandlers) RunCommand(c *gin.Context) {
	deviceIDStr := c.Param("id")
	deviceID, err := strconv.ParseUint(deviceIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	var req struct {
		Command string `json:"command" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	output, err := h.inventoryService.ExecuteCommand(c, uint(deviceID), req.Command)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "output": output})
		return
	}

	c.JSON(http.StatusOK, gin.H{"output": output})
}
