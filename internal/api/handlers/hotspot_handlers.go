package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"networking-main/internal/models"
	"networking-main/pkg/daraja"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ListPackages returns pricing packages, optionally filtered by type
func (h *APIHandlers) ListPackages(c *gin.Context) {
	pkgType := c.Query("type")

	var packages []models.PricingPackage
	query := h.DB.Where("is_active = ?", true)
	if pkgType != "" {
		query = query.Where("type = ?", pkgType)
	}

	if err := query.Order("sort_order asc").Find(&packages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, packages)
}

type PaymentRequest struct {
	PhoneNumber string `json:"phone_number"`
	PackageID   uint   `json:"package_id"`
	MACAddress  string `json:"mac_address"`
}

// InitiatePayment initiates an M-Pesa STK Push
func (h *APIHandlers) InitiatePayment(c *gin.Context) {
	var req PaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if monetization is enabled
	var setting models.SystemSetting
	if err := h.DB.Where("key = ?", "monetization_enabled").First(&setting).Error; err == nil {
		if setting.Value != "true" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Monetization is currently disabled by administrator"})
			return
		}
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusForbidden, gin.H{"error": "Monetization is currently disabled (configuration missing)"})
		return
	} else {
		// RecordNotFound -> Block
		c.JSON(http.StatusForbidden, gin.H{"error": "Monetization is currently disabled (configuration missing)"})
		return
	}

	var pkg models.PricingPackage
	if err := h.DB.First(&pkg, req.PackageID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Package not found"})
		return
	}

	// 1. Create or Update HotspotUser
	var user models.HotspotUser
	h.DB.Where("phone_number = ?", req.PhoneNumber).FirstOrCreate(&user, models.HotspotUser{
		PhoneNumber: req.PhoneNumber,
		MACAddress:  req.MACAddress,
	})

	// 2. Initiate STK Push
	stkResp, err := h.darajaClient.InitiateSTKPush(req.PhoneNumber, int(pkg.Price), "WiFiPayment", fmt.Sprintf("WiFi Plan: %s", pkg.Name))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initiate M-Pesa payment: " + err.Error()})
		return
	}

	// 3. Save Payment Record
	payment := models.Payment{
		UserID:            user.ID,
		PackageID:         pkg.ID,
		Amount:            pkg.Price,
		MerchantRequestID: stkResp.MerchantRequestID,
		CheckoutRequestID: stkResp.CheckoutRequestID,
		Status:            "pending",
	}
	h.DB.Create(&payment)

	c.JSON(http.StatusOK, gin.H{
		"message":             stkResp.CustomerMessage,
		"checkout_request_id": stkResp.CheckoutRequestID,
	})
}

// CheckPaymentStatus checks the status of a payment
func (h *APIHandlers) CheckPaymentStatus(c *gin.Context) {
	checkoutID := c.Param("id")
	var payment models.Payment
	if err := h.DB.Preload("user").Where("checkout_request_id = ?", checkoutID).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": payment.Status,
	})
}

// MpesaCallback handles Safaricom callbacks
func (h *APIHandlers) MpesaCallback(c *gin.Context) {
	var callback daraja.CallbackData
	body, _ := io.ReadAll(c.Request.Body)
	if err := json.Unmarshal(body, &callback); err != nil {
		c.Status(http.StatusBadRequest)
		return
	}

	stk := callback.Body.StkCallback
	var payment models.Payment
	if err := h.DB.Preload("PricingPackage").Where("checkout_request_id = ?", stk.CheckoutRequestID).First(&payment).Error; err != nil {
		c.Status(http.StatusOK)
		return
	}

	if stk.ResultCode == 0 {
		payment.Status = "completed"
		payment.TransactionRef = h.extractMpesaReceipt(stk)
		payment.TransactionDate = time.Now()

		var user models.HotspotUser
		h.DB.First(&user, payment.UserID)

		newExpiry := time.Now().Add(time.Duration(payment.PricingPackage.Duration) * time.Minute)
		if user.AccessExpiresAt.After(time.Now()) {
			newExpiry = user.AccessExpiresAt.Add(time.Duration(payment.PricingPackage.Duration) * time.Minute)
		}
		user.AccessExpiresAt = newExpiry
		h.DB.Save(&user)
	} else {
		payment.Status = "failed"
		payment.Message = stk.ResultDesc
	}

	h.DB.Save(&payment)
	c.JSON(http.StatusOK, gin.H{"message": "Callback processed"})
}

type VoucherRequest struct {
	Code       string `json:"code"`
	MACAddress string `json:"mac_address"`
}

// RedeemVoucher handles voucher redemption
func (h *APIHandlers) RedeemVoucher(c *gin.Context) {
	var req VoucherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var voucher models.Voucher
	if err := h.DB.Preload("PricingPackage").Where("code = ? AND status = ?", req.Code, "active").First(&voucher).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid or already used voucher"})
		return
	}

	// 1. Check/Create HotspotUser
	var user models.HotspotUser
	// For vouchers, we might not have a phone number yet, use MAC as fallback or username
	h.DB.Where("mac_address = ?", req.MACAddress).FirstOrCreate(&user, models.HotspotUser{
		MACAddress: req.MACAddress,
		Username:   req.MACAddress,
	})

	// 2. Update User access time
	newExpiry := time.Now().Add(time.Duration(voucher.PricingPackage.Duration) * time.Minute)
	if user.AccessExpiresAt.After(time.Now()) {
		newExpiry = user.AccessExpiresAt.Add(time.Duration(voucher.PricingPackage.Duration) * time.Minute)
	}
	user.AccessExpiresAt = newExpiry
	h.DB.Save(&user)

	// 3. Mark Voucher as used
	voucher.Status = "used"
	voucher.UsedBy = user.ID
	voucher.UsedAt = time.Now()
	h.DB.Save(&voucher)

	c.JSON(http.StatusOK, gin.H{
		"message": "Voucher redeemed successfully",
		"expiry":  user.AccessExpiresAt,
	})
}

// GetVouchers returns all vouchers
func (h *APIHandlers) GetVouchers(c *gin.Context) {
	var vouchers []models.Voucher
	if err := h.DB.Preload("PricingPackage").Order("created_at desc").Find(&vouchers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, vouchers)
}

// CreateVoucher creates a new voucher
func (h *APIHandlers) CreateVoucher(c *gin.Context) {
	var voucher models.Voucher
	if err := c.ShouldBindJSON(&voucher); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	voucher.Status = "active"
	voucher.CreatedAt = time.Now()

	if err := h.DB.Create(&voucher).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, voucher)
}

func (h *APIHandlers) extractMpesaReceipt(stk daraja.StkCallback) string {
	for _, item := range stk.CallbackMetadata.Item {
		if item.Name == "MpesaReceiptNumber" {
			if val, ok := item.Value.(string); ok {
				return val
			}
		}
	}
	return ""
}
