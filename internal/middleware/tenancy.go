package middleware

import (
	"log"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const TenantIDKey = "tenant_id"

// TenantMiddleware extracts and enforces tenant context
func TenantMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Extract Tenant ID
		// Priority: JWT > Header > Default (1)
		tenantID := ""

		// If authenticated, use user's tenant from JWT
		if _, exists := c.Get("user_id"); exists {
			// In a real system, look up user's tenant or get from JWT claims
			// For now, if we have a user_id, we'll assume they are bound to a tenant
			if tid, ok := c.Get(TenantIDKey); ok {
				tenantID = tid.(string)
			}
		}

		// Fallback to Header if still empty (allow for some internal/admin overrides if needed)
		if tenantID == "" {
			tenantID = c.GetHeader("X-Tenant-ID")
		}

		// Default to main tenant if missing
		if tenantID == "" {
			tenantID = "1"
		}

		// 2. Set in Context
		c.Set(TenantIDKey, tenantID)

		// 3. (Optional) Enforce DB Scope
		// This requires GORM to support dynamic scopes which is complex to inject globally safely
		// Better handled in Service layer or Repository pattern using db.Where("tenant_id = ?", tid)

		log.Printf("[Tenancy] Request for Tenant: %s", tenantID)

		c.Next()
	}
}

// TenantScope is a GORM scope helper
func TenantScope(c *gin.Context) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		tenantID := c.GetString(TenantIDKey)
		if tenantID == "" {
			return db
		}
		return db.Where("tenant_id = ?", tenantID)
	}
}
