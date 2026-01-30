package handlers

import (
	"net/http"
	"networking-main/internal/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ============ IPAM Handlers ============

func (h *APIHandlers) ListIPPools(c *gin.Context) {
	var pools []models.IPPool
	if err := h.DB.Find(&pools).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pools)
}

func (h *APIHandlers) CreateIPPool(c *gin.Context) {
	var pool models.IPPool
	if err := c.ShouldBindJSON(&pool); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.ipamService.CreatePool(c.Request.Context(), &pool); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, pool)
}

func (h *APIHandlers) GetIPLeases(c *gin.Context) {
	poolID, _ := strconv.Atoi(c.Param("id"))
	var leases []models.IPLease
	if err := h.DB.Where("pool_id = ?", poolID).Find(&leases).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, leases)
}

// ============ Billing Handlers ============

func (h *APIHandlers) GetUserInvoices(c *gin.Context) {
	userID := c.GetUint("user_id")
	invoices, err := h.billingService.GetUserInvoices(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, invoices)
}

func (h *APIHandlers) PayInvoice(c *gin.Context) {
	invoiceID, _ := strconv.Atoi(c.Param("id"))
	// In a real system, this would trigger Daraja. For now, we simulate success.
	if err := h.billingService.MarkAsPaid(c.Request.Context(), uint(invoiceID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Invoice marked as paid"})
}

// ============ FUP Handlers ============

func (h *APIHandlers) GetFUPStatus(c *gin.Context) {
	userID := c.GetUint("user_id")
	// For demo, we assume package ID 1
	throttled, err := h.fupService.CheckFUPStatus(c.Request.Context(), userID, 1)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	usage, limit, err := h.fupService.GetUsageStats(c.Request.Context(), userID, 1)
	if err != nil {
		// Non-critical error, just log it and return basic status
		// logger.Error("Failed to get usage stats", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"throttled": throttled,
		"usage":     usage,
		"limit":     limit,
	})
}

func (h *APIHandlers) ConfigureFUP(c *gin.Context) {
	var config models.FUPConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.DB.Save(&config).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, config)
}

// ============ Provisioning Handlers ============

func (h *APIHandlers) SyncUserToRouter(c *gin.Context) {
	userID, _ := strconv.Atoi(c.Param("uid"))
	deviceID, _ := strconv.Atoi(c.Param("did"))

	if err := h.provisioning.SyncUserToRouter(c.Request.Context(), uint(userID), uint(deviceID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User synced to router successfully"})
}

// ============ Probe Handlers ============

func (h *APIHandlers) ProbeHeartbeat(c *gin.Context) {
	var req struct {
		ID      uint   `json:"id"`
		Version string `json:"version"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.probeService.RegisterHeartbeat(c.Request.Context(), req.ID, req.Version, c.ClientIP()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "recorded"})
}

func (h *APIHandlers) RecordProbeResult(c *gin.Context) {
	var result models.ProbeResult
	if err := c.ShouldBindJSON(&result); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.probeService.RecordResult(c.Request.Context(), &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, result)
}

// ============ Webhook Handlers ============

func (h *APIHandlers) CreateWebhook(c *gin.Context) {
	var wh models.WebhookConfig
	if err := c.ShouldBindJSON(&wh); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.DB.Create(&wh).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, wh)
}

func (h *APIHandlers) ListWebhooks(c *gin.Context) {
	var whs []models.WebhookConfig
	h.DB.Find(&whs)
	c.JSON(http.StatusOK, whs)
}
