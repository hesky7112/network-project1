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
		// Priority: Header > JWT > Default (1)
		tenantID := c.GetHeader("X-Tenant-ID")

		// If authenticated, check user's tenant
		if c.GetBool("authenticated") {
			// Assuming auth middleware sets this (mock for now)
			// userTenant := c.GetString("user_tenant_id")
			// if userTenant != "" {
			// 	tenantID = userTenant
			// }
		}

		// Default to main tenant if missing (Migration Path)
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
