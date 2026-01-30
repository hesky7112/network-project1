package handlers

import (
	"log"
	"net/http"
	"networking-main/internal/models"

	"github.com/gin-gonic/gin"
)

// ListWorkflows retrieves all workflows
func (h *APIHandlers) ListWorkflows(c *gin.Context) {
	var workflows []models.Workflow
	if err := h.DB.Find(&workflows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch workflows"})
		return
	}
	c.JSON(http.StatusOK, workflows)
}

// GetWorkflow retrieves a single workflow
func (h *APIHandlers) GetWorkflow(c *gin.Context) {
	id := c.Param("id")
	var workflow models.Workflow
	if err := h.DB.First(&workflow, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
		return
	}
	c.JSON(http.StatusOK, workflow)
}

// CreateWorkflow creates a new workflow
func (h *APIHandlers) CreateWorkflow(c *gin.Context) {
	var workflow models.Workflow
	if err := c.ShouldBindJSON(&workflow); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.DB.Create(&workflow).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create workflow"})
		return
	}

	c.JSON(http.StatusCreated, workflow)
}

// UpdateWorkflow updates an existing workflow
func (h *APIHandlers) UpdateWorkflow(c *gin.Context) {
	id := c.Param("id")
	var workflow models.Workflow
	if err := h.DB.First(&workflow, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
		return
	}

	var updateData models.Workflow
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Only update fields that are allowed to be updated
	workflow.Name = updateData.Name
	workflow.Description = updateData.Description
	workflow.Definition = updateData.Definition
	workflow.TriggerType = updateData.TriggerType
	workflow.CronSched = updateData.CronSched
	workflow.IsActive = updateData.IsActive

	if err := h.DB.Save(&workflow).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update workflow"})
		return
	}

	c.JSON(http.StatusOK, workflow)
}

// DeleteWorkflow deletes a workflow
func (h *APIHandlers) DeleteWorkflow(c *gin.Context) {
	id := c.Param("id")
	if err := h.DB.Delete(&models.Workflow{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete workflow"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Workflow deleted"})
}

// RunWorkflow triggers a workflow execution directly
func (h *APIHandlers) RunWorkflow(c *gin.Context) {
	id := c.Param("id")
	var workflow models.Workflow
	if err := h.DB.First(&workflow, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
		return
	}

	// Logic to trigger workflow execution would go here
	// For now, we stub it.
	log.Printf("Executing workflow: %s (%d)", workflow.Name, workflow.ID)

	c.JSON(http.StatusOK, gin.H{
		"message":      "Workflow execution started",
		"execution_id": "exec_" + id + "_stub",
	})
}
