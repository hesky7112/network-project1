package middleware

import (
	"fmt"
	"net/http"
	"networking-main/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// WalledGarden returns a middleware that intercepts traffic based on billing/FUP status
func WalledGarden(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Get User ID from JWT context (assuming it's already processed)
		userID, exists := c.Get("userID")
		if !exists {
			c.Next()
			return
		}

		// 2. Check for overdue invoices
		var invoice models.Invoice
		// Status in model: "unpaid", "paid", "overdue", "cancelled"
		err := db.Where("user_id = ? AND status IN (?) AND due_date < NOW()", userID, []string{"unpaid", "overdue"}).First(&invoice).Error
		if err == nil {
			// Found an overdue invoice!
			// Redirect to payment portal or intercept with Walled Garden JSON
			if c.GetHeader("Accept") == "application/json" {
				c.AbortWithStatusJSON(http.StatusPaymentRequired, gin.H{
					"error":      "Account suspended due to overdue invoice",
					"invoice_id": invoice.ID,
					"amount":     invoice.Amount,
					"redirect":   "/portal/pay",
				})
			} else {
				c.Redirect(http.StatusTemporaryRedirect, "/portal/pay?invoice="+fmt.Sprint(invoice.ID))
				c.Abort()
			}
			return
		}

		// 3. Check for blacklisted users
		var user models.HotspotUser
		if err := db.Where("id = ?", userID).First(&user).Error; err == nil {
			// If we have a dedicated field like IsBlocked or FUPThrottled
			// This would be updated by a background worker or chron job calling fupService
			if user.IsBlacklisted {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
					"error": "Access denied. Your account is blacklisted.",
				})
				return
			}
		}

		c.Next()
	}
}
