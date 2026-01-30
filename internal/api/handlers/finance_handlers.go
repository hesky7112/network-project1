package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *APIHandlers) GetFinancialOverview(c *gin.Context) {
	overview, err := h.FinanceService.GetOverview(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, overview)
}

func (h *APIHandlers) GetRevenueTrends(c *gin.Context) {
	// Simulated trends for now
	c.JSON(http.StatusOK, gin.H{"trends": []interface{}{}})
}

// GetWallet returns the current user's wallet
func (h *APIHandlers) GetWallet(c *gin.Context) {
	userID := c.GetUint("user_id")
	wallet, err := h.FinanceService.GetWallet(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, wallet)
}

// TopUpWallet adds funds
func (h *APIHandlers) TopUpWallet(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req struct {
		Amount float64 `json:"amount" binding:"required,gt=0"`
		Ref    string  `json:"ref"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wallet, err := h.FinanceService.TopUp(c.Request.Context(), userID, req.Amount, req.Ref)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, wallet)
}

// GetWalletTransactions returns history
func (h *APIHandlers) GetWalletTransactions(c *gin.Context) {
	userID := c.GetUint("user_id")
	txns, err := h.FinanceService.GetWalletTransactions(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, txns)
}

// GetSellerStats returns statistics for the logged-in seller
func (h *APIHandlers) GetSellerStats(c *gin.Context) {
	userID := c.GetUint("user_id")
	stats, err := h.FinanceService.GetSellerStats(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}
