package modules

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ========== Docs API ==========

// ListDocs returns the full navigation structure
func (h *Handlers) ListDocs(c *gin.Context) {
	cats, err := h.registry.ListDocCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch docs"})
		return
	}
	c.JSON(http.StatusOK, cats)
}

// GetDoc returns a single page content
func (h *Handlers) GetDoc(c *gin.Context) {
	id := c.Param("id")
	page, err := h.registry.GetDocPage(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Page not found"})
		return
	}
	c.JSON(http.StatusOK, page)
}
