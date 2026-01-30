package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// IngestNeuralLog handles manual log ingestion into the vector store
func (h *APIHandlers) IngestNeuralLog(c *gin.Context) {
	var req struct {
		ID       string                 `json:"id"`
		Content  string                 `json:"content"`
		Metadata map[string]interface{} `json:"metadata"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.Neural.IngestLog(req.ID, req.Content, req.Metadata)
	c.JSON(http.StatusOK, gin.H{"message": "Intelligence ingested 🧠"})
}

// SearchNeuralEvents handles semantic search across stored logs
func (h *APIHandlers) SearchNeuralEvents(c *gin.Context) {
	query := c.Query("q")
	limitStr := c.DefaultQuery("limit", "5")
	limit, _ := strconv.Atoi(limitStr)

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query 'q' is required"})
		return
	}

	results := h.Neural.FindRelatedEvents(query, limit)
	c.JSON(http.StatusOK, results)
}

// ResetNeuralCore clears the vector store
func (h *APIHandlers) ResetNeuralCore(c *gin.Context) {
	h.Neural.Reset()
	c.JSON(http.StatusOK, gin.H{"message": "Intelligence reset 🧹"})
}
