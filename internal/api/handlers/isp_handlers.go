package handlers

import (
	"net/http"
	"networking-main/internal/models"
	"strconv"
	"time"

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
	userID := c.GetUint("user_id")

	// In a real system, this would trigger Daraja. For now, we simulate success.
	if err := h.billingService.MarkAsPaid(c.Request.Context(), uint(invoiceID), userID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
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

// ============ ISP Handlers ============

// GetISPPackages returns available internet packages
func (h *APIHandlers) GetISPPackages(c *gin.Context) {
	// In a real app, fetch from DB. For now, return static list or mock
	packages := []gin.H{
		{"id": 1, "name": "Basic Home", "speed": "10Mbps", "price": 2500},
		{"id": 2, "name": "Power User", "speed": "50Mbps", "price": 4500},
		{"id": 3, "name": "Alien Enterprise", "speed": "1Gbps", "price": 15000},
	}
	c.JSON(http.StatusOK, packages)
}

// SubscribeISP handles user subscription to an ISP package
func (h *APIHandlers) SubscribeISP(c *gin.Context) {
	var req struct {
		PackageID uint `json:"package_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetUint("user_id")
	// logic to subscribe user to package... e.g., create record in DB
	// For now, mock success
	c.JSON(http.StatusOK, gin.H{
		"message":    "Subscription successful",
		"user_id":    userID,
		"package_id": req.PackageID,
		"status":     "active",
	})
}

// GetMySubscriptions returns the current user's subscriptions
func (h *APIHandlers) GetMySubscriptions(c *gin.Context) {
	userID := c.GetUint("user_id")
	// logic to fetch subscriptions...
	// Mock response
	subscriptions := []gin.H{
		{
			"id":         101,
			"package_id": 2,
			"name":       "Power User",
			"status":     "active",
			"expires_at": time.Now().AddDate(0, 1, 0),
		},
	}
	c.JSON(http.StatusOK, gin.H{
		"user_id":       userID,
		"subscriptions": subscriptions,
	})
}
