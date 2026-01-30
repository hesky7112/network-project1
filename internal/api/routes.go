package api

import (
	"time"

	"networking-main/pkg/admin"
	"networking-main/pkg/auth"
	"networking-main/pkg/discovery"
	"networking-main/pkg/health"
	"networking-main/pkg/inventory"
	"networking-main/pkg/netconfig"
	"networking-main/pkg/onboarding"
	"networking-main/pkg/reporting"
	"networking-main/pkg/staff"
	"networking-main/pkg/telemetry"
	"networking-main/pkg/topology"

	"github.com/gin-gonic/gin"
)

type Handlers struct {
	AuthService      *auth.Service
	DiscoveryService *discovery.Service
	InventoryService *inventory.Service
	ConfigService    *netconfig.Service
	TelemetryService *telemetry.Service
	AdminService     *admin.Service
	HealthEngine     *health.HealthAnalysisEngine
	Onboarding       *onboarding.OnboardingSystem
	TopologyAnalyzer *topology.AdvancedTopologyAnalyzer
	Reporting        *reporting.ReportingSystem
	StaffTracking    *staff.StaffTrackingSystem
	RBACManager      *auth.RBACManager
}

func NewHandlers(
	authService *auth.Service,
	discoveryService *discovery.Service,
	inventoryService *inventory.Service,
	configService *netconfig.Service,
	telemetryService *telemetry.Service,
	adminService *admin.Service,
	healthEngine *health.HealthAnalysisEngine,
	onboarding *onboarding.OnboardingSystem,
	topologyAnalyzer *topology.AdvancedTopologyAnalyzer,
	reporting *reporting.ReportingSystem,
	staffTracking *staff.StaffTrackingSystem,
	rbacManager *auth.RBACManager,
) *Handlers {
	return &Handlers{
		AuthService:      authService,
		DiscoveryService: discoveryService,
		InventoryService: inventoryService,
		ConfigService:    configService,
		TelemetryService: telemetryService,
		AdminService:     adminService,
		HealthEngine:     healthEngine,
		Onboarding:       onboarding,
		TopologyAnalyzer: topologyAnalyzer,
		Reporting:        reporting,
		StaffTracking:    staffTracking,
		RBACManager:      rbacManager,
	}
}

// RBAC middleware
func (h *Handlers) RBACMiddleware(resource, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetUint("user_id")
		username := c.GetString("username")

		if !h.RBACManager.HasPermission(userID, resource, action) {
			h.RBACManager.LogAccess(userID, username, action, resource, 0, c.ClientIP(), c.Request.UserAgent(), false, "Permission denied")
			c.JSON(403, gin.H{"error": "Permission denied"})
			c.Abort()
			return
		}

		c.Next()

		// Log successful access
		h.RBACManager.LogAccess(userID, username, action, resource, 0, c.ClientIP(), c.Request.UserAgent(), true, "")
	}
}

func SetupRoutes(r *gin.Engine, handlers *Handlers) {
	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Auth routes
		auth := v1.Group("/auth")
		{
			auth.POST("/login", handlers.AuthService.Login)
			auth.POST("/logout", handlers.AuthService.Logout)
			auth.POST("/register", handlers.AuthService.Register)
			auth.POST("/forgot-password", handlers.AuthService.ForgotPassword)
			auth.POST("/reset-password", handlers.AuthService.ResetPassword)
		}

		// Health routes
		health := v1.Group("/health")
		health.Use(handlers.AuthService.JWTAuthMiddleware())
		health.Use(handlers.RBACMiddleware("health", "read"))
		{
			health.GET("/analysis/latest", func(c *gin.Context) {
				analysis, err := handlers.HealthEngine.GetLatestAnalysis()
				if err != nil {
					c.JSON(500, gin.H{"error": err.Error()})
					return
				}
				c.JSON(200, analysis)
			})
		}

		// Onboarding routes
		onboarding := v1.Group("/onboarding")
		onboarding.Use(handlers.AuthService.JWTAuthMiddleware())
		{
			onboarding.GET("/status", func(c *gin.Context) {
				userID := c.GetUint("user_id")
				status, err := handlers.Onboarding.GetUserOnboarding(userID)
				if err != nil {
					c.JSON(500, gin.H{"error": err.Error()})
					return
				}
				c.JSON(200, status)
			})
		}

		// Reporting routes
		reports := v1.Group("/reports")
		reports.Use(handlers.AuthService.JWTAuthMiddleware())
		reports.Use(handlers.RBACMiddleware("reports", "read"))
		{
			reports.GET("", func(c *gin.Context) {
				userID := c.GetUint("user_id")
				reports, err := handlers.Reporting.GetReportsByUser(userID)
				if err != nil {
					c.JSON(500, gin.H{"error": err.Error()})
					return
				}
				c.JSON(200, reports)
			})
		}

		// Staff routes
		staff := v1.Group("/staff")
		staff.Use(handlers.AuthService.JWTAuthMiddleware())
		{
			staff.POST("/checkin", func(c *gin.Context) {
				userID := c.GetUint("user_id")
				attendance, err := handlers.StaffTracking.CheckIn(userID, "office", c.ClientIP())
				if err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}
				c.JSON(200, attendance)
			})
		}

		// Inventory routes
		inventory := v1.Group("/inventory")
		inventory.Use(handlers.AuthService.JWTAuthMiddleware())
		inventory.Use(handlers.RBACMiddleware("inventory", "read"))
		{
			inventory.GET("/devices", func(c *gin.Context) {
				// Mock device data for now
				devices := []gin.H{
					{
						"id":          1,
						"hostname":    "router-01",
						"ip_address":  "192.168.1.1",
						"status":      "active",
						"device_type": "router",
					},
					{
						"id":          2,
						"hostname":    "switch-01",
						"ip_address":  "192.168.1.2",
						"status":      "active",
						"device_type": "switch",
					},
				}
				c.JSON(200, devices)
			})
		}

		// Telemetry routes
		telemetry := v1.Group("/telemetry")
		telemetry.Use(handlers.AuthService.JWTAuthMiddleware())
		telemetry.Use(handlers.RBACMiddleware("telemetry", "read"))
		{
			telemetry.GET("/live", func(c *gin.Context) {
				// Mock live telemetry data
				metrics := gin.H{
					"cpu_usage":          45.5,
					"memory_usage":       67.2,
					"packet_loss":        0.1,
					"latency":            23.5,
					"active_connections": 150,
				}
				c.JSON(200, metrics)
			})

			telemetry.GET("/alerts", func(c *gin.Context) {
				// Mock telemetry alerts
				alerts := []gin.H{
					{
						"id":           1,
						"device_name":  "router-01",
						"severity":     "medium",
						"type":         "cpu_usage",
						"message":      "High CPU usage detected",
						"timestamp":    time.Now().Format(time.RFC3339),
						"acknowledged": false,
					},
					{
						"id":           2,
						"device_name":  "switch-01",
						"severity":     "low",
						"type":         "port_down",
						"message":      "Port 5 is down",
						"timestamp":    time.Now().Add(-5 * time.Minute).Format(time.RFC3339),
						"acknowledged": true,
					},
				}
				c.JSON(200, alerts)
			})
		}

		// RBAC routes
		rbac := v1.Group("/rbac")
		rbac.Use(handlers.AuthService.JWTAuthMiddleware())
		{
			rbac.GET("/roles", func(c *gin.Context) {
				userID := c.GetUint("user_id")
				roles, err := handlers.RBACManager.GetUserRoles(userID)
				if err != nil {
					c.JSON(500, gin.H{"error": err.Error()})
					return
				}
				c.JSON(200, roles)
			})
		}
	}
}
