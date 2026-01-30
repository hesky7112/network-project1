package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type MockResponse struct {
	Message string `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func main() {
	r := gin.Default()

	// Simple CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	api := r.Group("/api/v1")

	// Auth endpoints
	auth := api.Group("/auth")
	{
		auth.POST("/login", func(c *gin.Context) {
			var req struct {
				Username string `json:"username"`
				Password string `json:"password"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// Mock successful login
			c.JSON(http.StatusOK, gin.H{
				"token": "mock-jwt-token-12345",
				"user": gin.H{
					"id": 1,
					"username": req.Username,
					"email": req.Username + "@example.com",
					"role": "admin",
				},
			})
		})

		auth.POST("/logout", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
		})

		auth.POST("/register", func(c *gin.Context) {
			var req struct {
				Username string `json:"username"`
				Email    string `json:"email"`
				Password string `json:"password"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusCreated, gin.H{
				"message": "User registered successfully",
				"user": gin.H{
					"id": 2,
					"username": req.Username,
					"email": req.Email,
					"role": "user",
				},
			})
		})

		auth.POST("/forgot-password", func(c *gin.Context) {
			var req struct {
				Email string `json:"email"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			resetLink := "http://localhost:3000/reset-password?token=mock-reset-token-12345"
			c.JSON(http.StatusOK, gin.H{
				"message": "If an account with this email exists, a password reset link has been sent.",
				"reset_link": resetLink,
			})
		})

		auth.POST("/reset-password", func(c *gin.Context) {
			var req struct {
				Token    string `json:"token"`
				Password string `json:"password"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
		})
	}

	// Inventory endpoints
	inventory := api.Group("/inventory")
	{
		inventory.GET("/devices", func(c *gin.Context) {
			devices := []gin.H{
				{
					"id": 1,
					"hostname": "router-01",
					"ip_address": "192.168.1.1",
					"status": "active",
					"device_type": "router",
				},
				{
					"id": 2,
					"hostname": "switch-01",
					"ip_address": "192.168.1.2",
					"status": "active",
					"device_type": "switch",
				},
			}
			c.JSON(http.StatusOK, devices)
		})
	}

	// Telemetry endpoints
	telemetry := api.Group("/telemetry")
	{
		telemetry.GET("/live", func(c *gin.Context) {
			metrics := []gin.H{
				{
					"metric": "cpu_usage",
					"value": 45.5,
					"unit": "%",
					"timestamp": time.Now().Format(time.RFC3339),
				},
				{
					"metric": "memory_usage",
					"value": 67.2,
					"unit": "%",
					"timestamp": time.Now().Format(time.RFC3339),
				},
				{
					"metric": "packet_loss",
					"value": 0.1,
					"unit": "%",
					"timestamp": time.Now().Format(time.RFC3339),
				},
				{
					"metric": "latency",
					"value": 23.5,
					"unit": "ms",
					"timestamp": time.Now().Format(time.RFC3339),
				},
				{
					"metric": "active_connections",
					"value": 150,
					"unit": "",
					"timestamp": time.Now().Format(time.RFC3339),
				},
				{
					"metric": "bandwidth_utilization",
					"value": 78.3,
					"unit": "%",
					"timestamp": time.Now().Format(time.RFC3339),
				},
				{
					"metric": "error_rate",
					"value": 0.02,
					"unit": "%",
					"timestamp": time.Now().Format(time.RFC3339),
				},
				{
					"metric": "throughput",
					"value": 950.5,
					"unit": "Mbps",
					"timestamp": time.Now().Format(time.RFC3339),
				},
			}
			c.JSON(http.StatusOK, metrics)
		})

		telemetry.GET("/alerts", func(c *gin.Context) {
			alerts := []gin.H{
				{
					"id": 1,
					"device_name": "router-01",
					"severity": "medium",
					"type": "cpu_usage",
					"message": "High CPU usage detected",
					"timestamp": time.Now().Format(time.RFC3339),
					"acknowledged": false,
				},
				{
					"id": 2,
					"device_name": "switch-01",
					"severity": "low",
					"type": "port_down",
					"message": "Port 5 is down",
					"timestamp": time.Now().Add(-5 * time.Minute).Format(time.RFC3339),
					"acknowledged": true,
				},
			}
			c.JSON(http.StatusOK, alerts)
		})

		telemetry.GET("/analysis/:deviceId", func(c *gin.Context) {
			analysis := gin.H{
				"total_flows": 15420,
				"total_bytes": 21474836480, // 20GB
				"total_packets": 128594023,
				"unique_sources": 234,
				"unique_destinations": 567,
				"top_protocols": []gin.H{
					{"protocol": "TCP", "percentage": 65.2},
					{"protocol": "UDP", "percentage": 28.7},
					{"protocol": "ICMP", "percentage": 6.1},
				},
				"top_talkers": []gin.H{
					{
						"source_ip": "192.168.1.100",
						"dest_ip": "10.0.0.50",
						"protocol": "TCP",
						"bytes": 1073741824, // 1GB
						"packets": 854792,
					},
					{
						"source_ip": "192.168.1.101",
						"dest_ip": "10.0.0.51",
						"protocol": "UDP",
						"bytes": 536870912, // 512MB
						"packets": 427396,
					},
				},
			}
			c.JSON(http.StatusOK, analysis)
		})

		telemetry.GET("/complete-analysis/:deviceId", func(c *gin.Context) {
			analysis := gin.H{
				"recommendations": []string{
					"Consider implementing QoS policies to prioritize critical traffic",
					"Monitor for unusual traffic patterns from 192.168.1.100",
					"Review firewall rules for excessive UDP traffic",
				},
				"anomalies_detected": 3,
				"traffic_baseline": gin.H{
					"normal_range": "100-200 Mbps",
					"current_usage": "178 Mbps",
					"deviation": "12%",
				},
			}
			c.JSON(http.StatusOK, analysis)
		})

		telemetry.POST("/netflow/start/:deviceId", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "NetFlow collection started successfully"})
		})

		telemetry.POST("/syslog/start/:deviceId", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "Syslog collection started successfully"})
		})

		telemetry.GET("/qos/:deviceId", func(c *gin.Context) {
			qosStats := []gin.H{
				{
					"interface_name": "GigabitEthernet0/1",
					"policy_name": "VOICE-POLICY",
					"class_name": "VOICE",
					"packets": 125000,
					"bytes": 10000000,
					"drops": 0,
					"drop_rate": 0.0,
				},
				{
					"interface_name": "GigabitEthernet0/1",
					"policy_name": "VIDEO-POLICY",
					"class_name": "VIDEO",
					"packets": 250000,
					"bytes": 200000000,
					"drops": 1250,
					"drop_rate": 0.5,
				},
				{
					"interface_name": "GigabitEthernet0/1",
					"policy_name": "DATA-POLICY",
					"class_name": "BEST-EFFORT",
					"packets": 500000,
					"bytes": 375000000,
					"drops": 25000,
					"drop_rate": 5.0,
				},
			}
			c.JSON(http.StatusOK, qosStats)
		})
	}

	// Health endpoints
	health := api.Group("/health")
	{
		health.GET("/analysis/latest", func(c *gin.Context) {
			analysis := gin.H{
				"id": 1,
				"overall_status": "healthy",
				"health_score": 92.5,
				"timestamp": time.Now().Format(time.RFC3339),
				"risk_level": "low",
				"affected_devices": 2,
				"estimated_impact": "Minimal impact on network operations",
				"system_health": gin.H{
					"cpu_usage_avg": 45.2,
					"memory_usage_avg": 62.1,
					"disk_usage_avg": 34.8,
					"active_devices": 8,
					"failed_devices": 0,
					"uptime_percentage": 99.7,
					"response_time_avg": 12.3,
					"error_rate": 0.01,
				},
				"network_health": gin.H{
					"packet_loss": 0.05,
					"latency": 15.2,
					"jitter": 2.1,
					"throughput_utilization": 67.8,
					"active_connections": 245,
					"dropped_packets": 12,
					"error_packets": 3,
				},
				"security_health": gin.H{
					"open_vulnerabilities": 2,
					"failed_logins": 3,
					"suspicious_activity": 1,
					"firewall_rule_violations": 0,
					"compliance_score": 95.2,
					"last_security_scan": time.Now().Format(time.RFC3339),
				},
			}
			c.JSON(http.StatusOK, analysis)
		})

		health.POST("/analysis/run", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "Health analysis started successfully"})
		})

		health.GET("/analysis/:id/issues", func(c *gin.Context) {
			issues := []gin.H{
				{
					"id": 1,
					"severity": "medium",
					"category": "Performance",
					"title": "High CPU Usage on Router-01",
					"description": "CPU usage has exceeded 80% for the last 15 minutes",
					"device_name": "Router-01",
					"current_value": 85.2,
					"threshold_value": 80,
					"impact": "May cause packet loss and slow response times",
					"detected_at": time.Now().Add(-10 * time.Minute).Format(time.RFC3339),
					"auto_fixable": true,
				},
				{
					"id": 2,
					"severity": "low",
					"category": "Security",
					"title": "Outdated Firmware",
					"description": "Device firmware is 2 versions behind latest release",
					"device_name": "Switch-01",
					"current_value": 1.2,
					"threshold_value": 1.4,
					"impact": "May have security vulnerabilities",
					"detected_at": time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
					"auto_fixable": false,
				},
			}
			c.JSON(http.StatusOK, issues)
		})

		health.GET("/issues/:id/fixes", func(c *gin.Context) {
			fixes := []gin.H{
				{
					"id": 1,
					"issue_id": 1,
					"title": "Reduce BGP Update Frequency",
					"description": "Configure BGP update intervals to reduce CPU load",
					"fix_type": "configuration",
					"estimated_time": 5,
					"risk_level": "low",
					"applied_at": nil,
					"success": false,
				},
				{
					"id": 2,
					"issue_id": 1,
					"title": "Enable Route Summarization",
					"description": "Configure route summarization to reduce routing table size",
					"fix_type": "configuration",
					"estimated_time": 10,
					"risk_level": "medium",
					"applied_at": nil,
					"success": false,
				},
			}
			c.JSON(http.StatusOK, fixes)
		})

		health.POST("/fixes/:id/apply", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "Fix applied successfully"})
		})
	}

	// Onboarding endpoints
	onboarding := api.Group("/onboarding")
	{
		onboarding.GET("/status", func(c *gin.Context) {
			status := gin.H{
				"user_id": 1,
				"completed_steps": []int{1, 2, 3},
				"current_step": 4,
				"total_steps": 6,
				"is_completed": false,
			}
			c.JSON(http.StatusOK, status)
		})
	}

	// Reports endpoints
	reports := api.Group("/reports")
	{
		reports.GET("", func(c *gin.Context) {
			reportList := []gin.H{
				{
					"id": 1,
					"title": "Network Performance Report",
					"type": "performance",
					"category": "Monthly Report",
					"creator_name": "System Admin",
					"created_at": time.Now().Add(-24 * time.Hour).Format(time.RFC3339),
					"status": "published",
					"priority": "medium",
					"summary": "Monthly network performance analysis showing optimal operation with 99.9% uptime and minimal latency.",
					"view_count": 15,
				},
				{
					"id": 2,
					"title": "Security Incident Report",
					"type": "security",
					"category": "Incident Response",
					"creator_name": "Security Team",
					"created_at": time.Now().Add(-48 * time.Hour).Format(time.RFC3339),
					"status": "published",
					"priority": "high",
					"summary": "Detailed analysis of recent security incident with remediation steps and prevention recommendations.",
					"view_count": 8,
				},
				{
					"id": 3,
					"title": "Compliance Audit Report",
					"type": "compliance",
					"category": "Regulatory Compliance",
					"creator_name": "Compliance Officer",
					"created_at": time.Now().Add(-72 * time.Hour).Format(time.RFC3339),
					"status": "draft",
					"priority": "low",
					"summary": "Quarterly compliance audit report covering SOC 2, GDPR, and HIPAA requirements.",
					"view_count": 3,
				},
			}
			c.JSON(http.StatusOK, reportList)
		})

		reports.GET("/type/:type", func(c *gin.Context) {
			reportType := c.Param("type")
			reportList := []gin.H{
				{
					"id": 1,
					"title": "Network Performance Report",
					"type": reportType,
					"category": "Monthly Report",
					"creator_name": "System Admin",
					"created_at": time.Now().Add(-24 * time.Hour).Format(time.RFC3339),
					"status": "published",
					"priority": "medium",
					"summary": "Monthly network performance analysis showing optimal operation.",
					"view_count": 15,
				},
			}
			c.JSON(http.StatusOK, reportList)
		})

		reports.POST("/generate/incident", func(c *gin.Context) {
			var req struct {
				TimeRange string `json:"time_range"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			newReport := gin.H{
				"id": 4,
				"title": "Incident Report - " + req.TimeRange,
				"type": "incident",
				"category": "Generated Report",
				"creator_name": "Automated System",
				"created_at": time.Now().Format(time.RFC3339),
				"status": "published",
				"priority": "high",
				"summary": "Automatically generated incident report for the specified time range.",
				"view_count": 0,
			}
			c.JSON(http.StatusOK, newReport)
		})

		reports.POST("/generate/performance", func(c *gin.Context) {
			var req struct {
				TimeRange string `json:"time_range"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			newReport := gin.H{
				"id": 5,
				"title": "Performance Report - " + req.TimeRange,
				"type": "performance",
				"category": "Generated Report",
				"creator_name": "Automated System",
				"created_at": time.Now().Format(time.RFC3339),
				"status": "published",
				"priority": "medium",
				"summary": "Automatically generated performance report for the specified time range.",
				"view_count": 0,
			}
			c.JSON(http.StatusOK, newReport)
		})

		reports.POST("/generate/security", func(c *gin.Context) {
			var req struct {
				TimeRange string `json:"time_range"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			newReport := gin.H{
				"id": 6,
				"title": "Security Report - " + req.TimeRange,
				"type": "security",
				"category": "Generated Report",
				"creator_name": "Automated System",
				"created_at": time.Now().Format(time.RFC3339),
				"status": "published",
				"priority": "high",
				"summary": "Automatically generated security report for the specified time range.",
				"view_count": 0,
			}
			c.JSON(http.StatusOK, newReport)
		})
	}

	// Staff endpoints
	staff := api.Group("/staff")
	{
		staff.POST("/checkin", func(c *gin.Context) {
			var req struct {
				Location string `json:"location"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			checkin := gin.H{
				"id": 1,
				"user_id": 1,
				"location": req.Location,
				"checkin_time": time.Now().Format(time.RFC3339),
				"status": "checked_in",
			}
			c.JSON(http.StatusOK, checkin)
		})
	}

	// RBAC endpoints
	rbac := api.Group("/rbac")
	{
		rbac.GET("/roles", func(c *gin.Context) {
			roles := []gin.H{
				{
					"id": 1,
					"name": "admin",
					"permissions": []string{"read", "write", "delete", "admin"},
				},
				{
					"id": 2,
					"name": "user",
					"permissions": []string{"read", "write"},
				},
			}
			c.JSON(http.StatusOK, roles)
		})
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"version": "1.0.0",
			"features": gin.H{
				"onboarding": true,
				"health": true,
				"topology": true,
				"reporting": true,
				"staff": true,
			},
		})
	})

	r.Run(":8080")
}
