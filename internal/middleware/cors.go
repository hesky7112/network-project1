package middleware

import (
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// CORS middleware configuration
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Allow specific origins from environment
		rawOrigins := os.Getenv("ALLOWED_ORIGINS")
		allowedOrigins := []string{
			"http://localhost:3000",
			"http://localhost:3002",
		}
		if rawOrigins != "" {
			allowedOrigins = strings.Split(rawOrigins, ",")
		}

		origin := c.Request.Header.Get("Origin")
		allowed := false

		// Check if the origin is in the allowed list
		for _, o := range allowedOrigins {
			if strings.TrimSpace(o) == origin {
				allowed = true
				break
			}
		}

		if allowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		// Handle preflight requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
