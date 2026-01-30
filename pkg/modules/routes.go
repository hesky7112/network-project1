package modules

import (
	"github.com/gin-gonic/gin"
)

// SetupModuleRoutes registers all module-related routes
func SetupModuleRoutes(router *gin.RouterGroup, handlers *Handlers, authMiddleware gin.HandlerFunc) {
	modules := router.Group("/modules")
	{
		// Public routes (no auth required)
		modules.GET("", handlers.ListModules)
		modules.GET("/categories", handlers.GetCategories)
		modules.GET("/featured", handlers.GetFeaturedModules)
		modules.GET("/:id", handlers.GetModule)
		modules.GET("/:id/ui", handlers.GetModuleUI)
		modules.GET("/:id/reviews", handlers.GetModuleReviews)
		modules.GET("/:id/stats", handlers.GetModuleStats)

		// Engine status (public health check)
		modules.GET("/engine/status", handlers.GetEngineStatus)
		modules.GET("/engine/primitives", handlers.GetPrimitives)

		// Documentation (Public)
		modules.GET("/docs", handlers.ListDocs)
		modules.GET("/docs/:id", handlers.GetDoc)

		// Protected routes (require authentication)
		protected := modules.Group("")
		protected.Use(authMiddleware)
		{
			// Licensing
			protected.POST("/:id/preview", handlers.StartPreview)
			protected.POST("/:id/purchase", handlers.PurchaseLicense)
			protected.GET("/:id/license/validate", handlers.ValidateLicense)

			// User licenses
			protected.GET("/licenses", handlers.GetUserLicenses)

			// Execution
			protected.POST("/:id/execute", handlers.ExecuteModule)
			protected.GET("/executions", handlers.GetExecutionLogs)

			// Downloads
			protected.GET("/:id/download", handlers.DownloadPackage)
			protected.GET("/:id/bundle", handlers.GetBrowserBundle) // Legacy JSON
			protected.GET("/:id/wasm", handlers.GetWasmBundle)      // New WASM HTML

			// Reviews
			protected.POST("/:id/reviews", handlers.SubmitReview)

			// Storage (Phase 1)
			protected.GET("/:id/storage", handlers.ListStorageValues)
			protected.GET("/:id/storage/:key", handlers.GetStorageValue)
			protected.POST("/:id/storage/:key", handlers.SetStorageValue)
			protected.DELETE("/:id/storage/:key", handlers.DeleteStorageValue)

			// Automation (Phase 2)
			protected.POST("/:id/schedule", handlers.CreateScheduledJob)
			protected.GET("/:id/schedule", handlers.ListScheduledJobs)
			protected.DELETE("/:id/schedule/:job_id", handlers.DeleteScheduledJob)
			protected.POST("/:id/webhook", handlers.CreateWebhook)

			// Creation (Public/User)
			protected.POST("", handlers.CreateModule)

			// Secrets (Phase 1.5)
			protected.POST("/secrets", handlers.SetSecret)
			protected.GET("/secrets", handlers.ListSecrets)
			protected.DELETE("/secrets/:key", handlers.DeleteSecret)

			// PDF Ops (Phase 6)
			protected.POST("/pdf/split", handlers.SplitPDF)
			protected.POST("/pdf/merge", handlers.MergePDFs)
			protected.POST("/pdf/watermark", handlers.WatermarkPDF)
			protected.POST("/pdf/extract", handlers.ExtractPDFData)
			protected.POST("/pdf/chat", handlers.PDFChat)

			// Community (Phase 6)
			// Threads
			protected.GET("/community/threads", handlers.ListThreads)
			protected.POST("/community/threads", handlers.CreateThread)
			protected.GET("/community/threads/:id", handlers.GetThread)
			protected.POST("/community/threads/:id/reply", handlers.ReplyToThread)

			// Leaderboard
			protected.GET("/community/leaderboard", handlers.GetLeaderboard)
			protected.GET("/community/users/:id/stats", handlers.GetUserStats)
		}
	}

	// Public Webhooks
	router.POST("/hooks/:slug", handlers.TriggerWebhook)
}

// SetupModuleAdminRoutes registers admin-only module routes
func SetupModuleAdminRoutes(router *gin.RouterGroup, handlers *Handlers, authMiddleware, adminMiddleware gin.HandlerFunc) {
	admin := router.Group("/modules")
	admin.Use(authMiddleware, adminMiddleware)
	{
		admin.Use(authMiddleware, adminMiddleware)
		{
			// admin.POST("", handlers.CreateModule) // Moved to protected user routes
			admin.PUT("/:id", handlers.UpdateModule)
			admin.DELETE("/:id", handlers.DeleteModule)
			admin.POST("/:id/package", handlers.UploadPackage)
		}
	}
}
