package api

import (
	"networking-main/internal/api/handlers"
	"networking-main/pkg/auth"
	"networking-main/pkg/modules"
	"time"

	"github.com/gin-gonic/gin"
)

// SetupCompleteRoutes sets up all API routes with RBAC
func SetupCompleteRoutes(router *gin.Engine, apiHandlers *handlers.APIHandlers, rbacManager *auth.RBACManager) {
	// API v1 group
	v1 := router.Group("/api/v1")

	// Apply Tenant Middleware
	// v1.Use(middleware.TenantMiddleware(apiHandlers.DB)) // Commenting out until DB schema migration for tenant_id is ready to avoid breaking current requests

	// Apply global rate limit (e.g. 1000 req/min)
	v1.Use(apiHandlers.RateLimiter.RateLimit(1000, time.Minute))

	// Auth Routes (Public)
	authGroup := v1.Group("/auth")
	{
		authGroup.POST("/login", apiHandlers.Login)
		authGroup.POST("/logout", apiHandlers.Logout)
		authGroup.POST("/register", apiHandlers.Register)
		authGroup.POST("/forgot-password", apiHandlers.ForgotPassword)
		authGroup.POST("/reset-password", apiHandlers.ResetPassword)
		authGroup.GET("/me", apiHandlers.JWTMiddleware(), apiHandlers.GetCurrentUser)
	}

	bot := v1.Group("/bot")
	{
		bot.POST("/webhook", apiHandlers.HandleBotWebhook)
	}

	// Hotspot Callbacks (Public)
	v1.POST("/hotspot/callback", apiHandlers.MpesaCallback)
	v1.GET("/portal/info", apiHandlers.GetPortalInfo)

	{

		// ============ Health & Recovery Routes ============
		health := v1.Group("/health")
		health.Use(apiHandlers.JWTMiddleware())
		health.Use(apiHandlers.RBACMiddleware("health", "read"))
		{
			health.GET("/analysis/latest", apiHandlers.GetLatestHealthAnalysis)
			health.GET("/analysis/:id/issues", apiHandlers.GetHealthIssues)
			health.GET("/issues/:id/fixes", apiHandlers.GetQuickFixes)
		}

		healthWrite := v1.Group("/health")
		healthWrite.Use(apiHandlers.RBACMiddleware("health", "execute"))
		{
			healthWrite.POST("/analysis/run", apiHandlers.RunHealthAnalysis)
			healthWrite.POST("/fixes/:id/apply", apiHandlers.ApplyQuickFix)
		}

		// ============ Onboarding Routes ============
		onboarding := v1.Group("/onboarding")
		onboarding.Use(apiHandlers.JWTMiddleware())
		{
			onboarding.GET("/status", apiHandlers.GetOnboardingStatus)
			onboarding.GET("/tours", apiHandlers.GetOnboardingTours)
			onboarding.POST("/steps/:id/complete", apiHandlers.CompleteOnboardingStep)
			onboarding.POST("/steps/:id/skip", apiHandlers.SkipOnboardingStep)
		}

		// ============ Topology Routes ============
		topology := v1.Group("/topology")
		topology.Use(apiHandlers.JWTMiddleware())
		topology.Use(apiHandlers.RBACMiddleware("topology", "read"))
		{
			topology.GET("/analysis/latest", apiHandlers.GetLatestTopologyAnalysis)
			topology.GET("/export", apiHandlers.ExportTopologyData)
		}

		topologyWrite := v1.Group("/topology")
		topologyWrite.Use(apiHandlers.RBACMiddleware("topology", "execute"))
		{
			topologyWrite.POST("/analysis/run", apiHandlers.RunTopologyAnalysis)
		}

		// ============ Reporting Routes ============
		reports := v1.Group("/reports")
		reports.Use(apiHandlers.JWTMiddleware())
		reports.Use(apiHandlers.RBACMiddleware("reports", "read"))
		{
			reports.GET("", apiHandlers.GetReports)
			reports.GET("/type/:type", apiHandlers.GetReportsByType)
			reports.GET("/:id/export", apiHandlers.ExportReport)
		}

		reportsWrite := v1.Group("/reports")
		reportsWrite.Use(apiHandlers.RBACMiddleware("reports", "write"))
		{
			reportsWrite.POST("/generate/incident", apiHandlers.GenerateIncidentReport)
			reportsWrite.POST("/generate/performance", apiHandlers.GeneratePerformanceReport)
			reportsWrite.POST("/generate/security", apiHandlers.GenerateSecurityReport)
		}

		// ============ Staff Tracking Routes ============
		staff := v1.Group("/staff")
		staff.Use(apiHandlers.JWTMiddleware())
		{
			// Attendance
			staff.POST("/checkin", apiHandlers.CheckIn)
			staff.POST("/checkout", apiHandlers.CheckOut)
			staff.GET("/attendance/today", apiHandlers.GetTodayAttendance)
			staff.GET("/attendance/report", apiHandlers.GetAttendanceReport)

			// Work Logs
			staff.POST("/worklog", apiHandlers.LogWork)
			staff.POST("/worklog/:id/complete", apiHandlers.CompleteWorkLog)
			staff.GET("/worklog/report", apiHandlers.GetWorkLogReport)

			// Leave Management
			staff.POST("/leave/request", apiHandlers.RequestLeave)
		}

		staffManagement := v1.Group("/staff")
		staffManagement.Use(apiHandlers.RBACMiddleware("users", "write"))
		{
			staffManagement.POST("/leave/:id/approve", apiHandlers.ApproveLeave)
		}

		// ============ RBAC & Audit Routes ============
		rbac := v1.Group("/rbac")
		rbac.Use(apiHandlers.JWTMiddleware())
		{
			rbac.GET("/roles", apiHandlers.GetUserRoles)
			rbac.GET("/activity", apiHandlers.GetUserActivity)
		}

		rbacAdmin := v1.Group("/rbac/admin")
		rbacAdmin.Use(apiHandlers.JWTMiddleware())
		rbacAdmin.Use(apiHandlers.RBACMiddleware("roles", "write"))
		{
			rbacAdmin.GET("/roles", apiHandlers.ListRoles)
			rbacAdmin.POST("/roles", apiHandlers.CreateRole)
			rbacAdmin.PUT("/roles", apiHandlers.UpdateRole)
			rbacAdmin.DELETE("/roles/:id", apiHandlers.DeleteRole)
			rbacAdmin.POST("/assign", apiHandlers.AssignRole)
			rbacAdmin.POST("/remove", apiHandlers.RemoveRole)

			// User Management
			rbacAdmin.GET("/users", apiHandlers.ListUsers)
			rbacAdmin.POST("/users", apiHandlers.CreateUser)
			rbacAdmin.PUT("/users/:id", apiHandlers.UpdateUser)
			rbacAdmin.DELETE("/users/:id", apiHandlers.DeleteUser)

			// Merchant Management
			rbacAdmin.GET("/merchants", apiHandlers.ListMerchants)
			rbacAdmin.POST("/merchants/:id/verify", apiHandlers.VerifyMerchant)
			rbacAdmin.POST("/merchants/:id/deny", apiHandlers.DenyMerchant)
		}

		audit := v1.Group("/audit")
		audit.Use(apiHandlers.JWTMiddleware())
		audit.Use(apiHandlers.RBACMiddleware("audit", "read"))
		{
			audit.GET("/logs", apiHandlers.GetAuditLogs)
		}

		// ============ Core Routes		// Inventory/Devices
		devices := v1.Group("/devices")
		{
			devices.GET("", apiHandlers.GetDevices)
			devices.POST("", apiHandlers.CreateDevice)
			devices.GET("/:id", apiHandlers.GetDevice)
			devices.PUT("/:id", apiHandlers.UpdateDevice)
			devices.DELETE("/:id", apiHandlers.DeleteDevice)
			devices.POST("/:id/backup", apiHandlers.CreateBackup)
			devices.GET("/:id/backups", apiHandlers.ListBackups)
			devices.POST("/:id/command", apiHandlers.RunCommand)

			// Device Proxying (Alien Feature 👽)
			devices.GET("/:id/proxy/*proxyPath", apiHandlers.ProxyToDevice)
		}

		configs := v1.Group("/configs")
		configs.Use(apiHandlers.JWTMiddleware())
		configs.Use(apiHandlers.RBACMiddleware("configs", "read"))
		{
			configs.GET("", apiHandlers.ListBackups)
			configs.POST("/backup", apiHandlers.CreateBackup)
			configs.POST("/restore/:id", apiHandlers.RestoreConfig) // device id
			configs.GET("/compare/:id", apiHandlers.CompareConfigs)
		}

		telemetry := v1.Group("/telemetry")
		telemetry.Use(apiHandlers.JWTMiddleware())
		telemetry.Use(apiHandlers.RBACMiddleware("telemetry", "read"))
		{
			telemetry.GET("/metrics/live", apiHandlers.GetLiveMetrics)
			telemetry.GET("/metrics/historical/:id", apiHandlers.GetHistoricalMetrics)
			telemetry.GET("/alerts", apiHandlers.GetAlerts)
			telemetry.GET("/ws", apiHandlers.TelemetryWebSocket)
		}

		tickets := v1.Group("/tickets")
		tickets.Use(apiHandlers.JWTMiddleware())
		tickets.Use(apiHandlers.RBACMiddleware("tickets", "read"))
		{
			tickets.GET("", apiHandlers.GetTickets)
			tickets.GET("/stats", apiHandlers.GetTicketStats)
			tickets.POST("", apiHandlers.CreateTicket)
			tickets.POST("/:id/assign", apiHandlers.AssignTicket)
			tickets.POST("/:id/resolve", apiHandlers.ResolveTicket)
		}

		dispatches := v1.Group("/dispatches")
		dispatches.Use(apiHandlers.JWTMiddleware())
		{
			dispatches.GET("/active", apiHandlers.GetActiveDispatches)
		}

		// ============ Workflow Routes (Flow Forge) ============
		workflows := v1.Group("/workflows")
		workflows.Use(apiHandlers.JWTMiddleware())
		{
			workflows.GET("", apiHandlers.ListWorkflows)
			workflows.POST("", apiHandlers.CreateWorkflow)
			workflows.GET("/:id", apiHandlers.GetWorkflow)
			workflows.PUT("/:id", apiHandlers.UpdateWorkflow)
			workflows.DELETE("/:id", apiHandlers.DeleteWorkflow)
			workflows.POST("/:id/run", apiHandlers.RunWorkflow)
		}

		chat := v1.Group("/chat")
		chat.Use(apiHandlers.JWTMiddleware())
		{
			chat.GET("/ws", apiHandlers.ChatWebSocket)
			chat.GET("/rooms", apiHandlers.GetChatRooms)
			chat.GET("/rooms/:roomID/messages", apiHandlers.GetChatMessages)
		}

		// ============ Hotspot Routes ============
		hotspot := v1.Group("/hotspot")
		{
			hotspot.GET("/packages", apiHandlers.ListPackages)
			hotspot.POST("/pay", apiHandlers.InitiatePayment)
			hotspot.GET("/vouchers", apiHandlers.GetVouchers)
			hotspot.GET("/vouchers/:code/qr", apiHandlers.GetVoucherQR)
			hotspot.POST("/vouchers", apiHandlers.CreateVoucher)
			hotspot.POST("/vouchers/redeem", apiHandlers.RedeemVoucher)
		}

		// ============ Settings Routes ============
		settings := v1.Group("/settings")
		settings.Use(apiHandlers.JWTMiddleware())
		settings.Use(apiHandlers.RBACMiddleware("roles", "write"))
		{
			settings.GET("", apiHandlers.GetSettings)
			settings.PATCH("", apiHandlers.UpdateSettings)
			settings.POST("", apiHandlers.UpdateSettings)
		}

		// ============ ISP Core Routes ============

		// IPAM
		ipam := v1.Group("/ipam")
		{
			ipam.GET("/pools", apiHandlers.ListIPPools)
			ipam.POST("/pools", apiHandlers.CreateIPPool)
			ipam.GET("/pools/:id/leases", apiHandlers.GetIPLeases)
		}

		// Billing
		billing := v1.Group("/billing")
		{
			billing.GET("/invoices", apiHandlers.JWTMiddleware(), apiHandlers.GetUserInvoices)
			billing.POST("/invoices/:id/pay", apiHandlers.JWTMiddleware(), apiHandlers.PayInvoice)
		}

		// Finance Group (Consolidating Wallet and new routes)
		finance := v1.Group("/finance")
		finance.Use(apiHandlers.JWTMiddleware())
		{
			finance.GET("/wallet", apiHandlers.GetWallet)
			finance.GET("/wallet/transactions", apiHandlers.GetWalletTransactions)
			finance.POST("/wallet/topup", apiHandlers.TopUpWallet)
			finance.GET("/seller/stats", apiHandlers.GetSellerStats)
		}

		// FUP
		fup := v1.Group("/fup")
		{
			fup.GET("/status", apiHandlers.JWTMiddleware(), apiHandlers.GetFUPStatus)
			fup.POST("/config", apiHandlers.ConfigureFUP)
		}

		// Provisioning
		provision := v1.Group("/provision")
		{
			provision.POST("/sync/:uid/:did", apiHandlers.SyncUserToRouter)
			provision.POST("/boost", apiHandlers.InitiateBoost)
			provision.POST("/priority", apiHandlers.SetPriority)
		}

		// Probes
		probes := v1.Group("/probes")
		{
			probes.POST("/heartbeat", apiHandlers.ProbeHeartbeat)
			probes.POST("/results", apiHandlers.RecordProbeResult)
		}

		// Webhooks
		webhooks := v1.Group("/webhooks")
		{
			webhooks.GET("/", apiHandlers.ListWebhooks)
			webhooks.POST("/", apiHandlers.CreateWebhook)
		}
		// AIOps (Alien Features 👽)
		aiops := v1.Group("/aiops")
		{
			aiops.GET("/anomalies", apiHandlers.GetAnomalies)
			aiops.GET("/churn/:uid", apiHandlers.PredictChurn)
		}

		// Migration Catalyst (ISP Ingestion 🛸)
		migrate := v1.Group("/migration")
		migrate.Use(apiHandlers.JWTMiddleware())
		{
			migrate.POST("/start", apiHandlers.StartMigration)
			migrate.GET("/status/:id", apiHandlers.GetMigrationStatus)
		}

		// Alien Treasury (Finance Management 💰)
		treasury := v1.Group("/treasury")
		treasury.Use(apiHandlers.JWTMiddleware())
		treasury.Use(apiHandlers.RBACMiddleware("reports", "read"))
		{
			treasury.GET("/overview", apiHandlers.GetFinancialOverview)
			treasury.GET("/trends", apiHandlers.GetRevenueTrends)
		}

		// Infrastructure Sniffer (King Tier 👑)
		v1.GET("/sniff/live", apiHandlers.SniffTraffic)

		// Simulation Routes
		simulation := v1.Group("/simulation")
		simulation.Use(apiHandlers.JWTMiddleware())
		{
			simulation.GET("/topology", apiHandlers.GetSimulationTopology)
			simulation.POST("/ping", apiHandlers.SimulatePing)
			simulation.POST("/failure", apiHandlers.InjectSimulationFailure)
			simulation.POST("/restore", apiHandlers.RestoreSimulationComponent)
		}

		/*
			// ISP
			isp := v1.Group("/isp")
			isp.Use(apiHandlers.JWTMiddleware())
			{
				isp.GET("/packages", apiHandlers.GetISPPackages)
				isp.POST("/subscriptions", apiHandlers.SubscribeISP)
				isp.GET("/my-subscriptions", apiHandlers.GetMySubscriptions)
			}
		*/
		sdwan := v1.Group("/sdwan")
		sdwan.Use(apiHandlers.JWTMiddleware())
		{
			sdwan.GET("/sites", apiHandlers.ListSites)
			sdwan.POST("/sites", apiHandlers.RegisterSite)
			sdwan.GET("/sites/:id/vpn", apiHandlers.GetVPNConfig)
			sdwan.POST("/ztp", apiHandlers.HandleZTP) // In reality, ZTP often doesn't need JWT if using serial auth, but for now we keep it secure or separate
		}

		// Wireless Controller Routes (Phase 3 📡)
		wlc := v1.Group("/wireless")
		wlc.Use(apiHandlers.JWTMiddleware())
		{
			wlc.GET("/aps", apiHandlers.GetWirelessInventory)
			wlc.POST("/aps", apiHandlers.ProvisionAP)
			wlc.POST("/ssids", apiHandlers.CreateSSID)
		}

		// ============ Network Upgrade Routes (SNMP, NetFlow, Compliance) ============
		network := v1.Group("/network")
		network.Use(apiHandlers.JWTMiddleware())
		network.Use(apiHandlers.RBACMiddleware("telemetry", "read"))
		{
			network.GET("/alerts", apiHandlers.GetNetworkAlerts)
			network.GET("/traffic", apiHandlers.GetTrafficStats)     // Aggregated flows
			network.GET("/top-talkers", apiHandlers.GetNetworkFlows) // Raw/Top flows
			network.GET("/compliance/drift", apiHandlers.GetDriftReport)
			network.POST("/compliance/check", apiHandlers.RunDriftCheck)
			network.GET("/device/:id/stats", apiHandlers.GetDeviceParsedStats)
		}

		// Scheduler Routes
		tasks := v1.Group("/tasks")
		tasks.Use(apiHandlers.JWTMiddleware())
		tasks.Use(apiHandlers.RBACMiddleware("tasks", "read"))
		{
			tasks.GET("/", apiHandlers.GetScheduledTasks)
			tasks.POST("/:name/trigger", apiHandlers.RBACMiddleware("tasks", "execute"), apiHandlers.TriggerScheduledTask)
			tasks.GET("/logs", apiHandlers.GetTaskLogs)
		}

		// Nexus Visualizer (Phase 7)
		nexusRoute := v1.Group("/nexus")
		{
			nexusRoute.GET("/stream", apiHandlers.StreamNexusData)
		}

		// Neural Core (Phase 4 🧠)
		neural := v1.Group("/neural")
		neural.Use(apiHandlers.JWTMiddleware())
		{
			neural.POST("/ingest", apiHandlers.IngestNeuralLog)
			neural.GET("/search", apiHandlers.SearchNeuralEvents)
			neural.POST("/reset", apiHandlers.ResetNeuralCore)
		}

		// Autonomous Remediation (Phase 5 🤖)
		remediation := v1.Group("/remediation")
		remediation.Use(apiHandlers.JWTMiddleware())
		{
			remediation.GET("/suggest/:id", apiHandlers.GetRemediationSuggestion)
			remediation.POST("/apply/:id", apiHandlers.ApplyRemediation)
		}

		// ============ Domain & Aura Administration ============
		domainAdmin := v1.Group("/admin/domain")
		domainAdmin.Use(apiHandlers.JWTMiddleware())
		domainAdmin.Use(apiHandlers.RBACMiddleware("roles", "write"))
		{
			domainAdmin.POST("/aura", apiHandlers.SetNetworkAura)
		}

		// ============ Module Marketplace (Phase 2 & 2.5 📦) ============
		moduleHandlers := modules.NewHandlers(apiHandlers.DB, apiHandlers.FinanceService)

		// Ensure module tables are migrated and seeded
		registry := modules.NewRegistry(apiHandlers.DB)
		registry.Migrate()
		registry.SeedDefaultModules()

		modules.SetupModuleRoutes(v1, moduleHandlers, apiHandlers.JWTMiddleware())

		// Admin routes for modules
		adminGroup := v1.Group("/admin/modules")
		adminGroup.Use(apiHandlers.JWTMiddleware())
		adminGroup.Use(apiHandlers.RBACMiddleware("roles", "write"))
		{
			adminGroup.POST("", moduleHandlers.CreateModule)
			adminGroup.PUT("/:id", moduleHandlers.UpdateModule)
			adminGroup.DELETE("/:id", moduleHandlers.DeleteModule)
			adminGroup.POST("/:id/package", moduleHandlers.UploadPackage)
		}
	}
}
