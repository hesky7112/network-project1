package security

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// SecurityMiddleware provides comprehensive security middleware
type SecurityMiddleware struct {
	rateLimiters   map[string]*rate.Limiter
	allowedOrigins []string
	cspDirectives  string
}

// NewSecurityMiddleware creates new security middleware
func NewSecurityMiddleware() *SecurityMiddleware {
	return &SecurityMiddleware{
		rateLimiters: make(map[string]*rate.Limiter),
		allowedOrigins: []string{
			"http://localhost:3000",
			"http://localhost:8080",
			"https://localhost:3000",
			"https://localhost:8080",
		},
		cspDirectives: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' ws: wss:; media-src 'none'; object-src 'none'; child-src 'none'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';",
	}
}

// GenerateSecureToken generates a cryptographically secure token
func GenerateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// HashPassword creates a secure hash of the password
func HashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return base64.StdEncoding.EncodeToString(hash[:])
}

// SecurityHeaders sets comprehensive security headers
func (sm *SecurityMiddleware) SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent clickjacking
		c.Header("X-Frame-Options", "DENY")

		// Prevent MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// Enable XSS protection
		c.Header("X-XSS-Protection", "1; mode=block")

		// Force HTTPS in production
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")

		// Content Security Policy
		c.Header("Content-Security-Policy", sm.cspDirectives)

		// Referrer Policy
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Permissions Policy
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=(), usb=()")

		// Prevent caching of sensitive pages
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Header("Pragma", "no-cache")
		c.Header("Expires", "0")

		c.Next()
	}
}

// CORS middleware with strict configuration
func (sm *SecurityMiddleware) CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Check if origin is allowed
		allowed := false
		for _, allowedOrigin := range sm.allowedOrigins {
			if origin == allowedOrigin {
				allowed = true
				break
			}
		}

		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token")
		c.Header("Access-Control-Max-Age", "86400")

		// Handle preflight requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// Rate limiting middleware
func (sm *SecurityMiddleware) RateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := sm.getClientIP(c)
		limiter := sm.getLimiter(clientIP)

		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Too many requests",
				"retry_after": "60 seconds",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// getLimiter gets rate limiter for client IP
func (sm *SecurityMiddleware) getLimiter(clientIP string) *rate.Limiter {
	limiter, exists := sm.rateLimiters[clientIP]
	if !exists {
		// 100 requests per minute per IP
		limiter = rate.NewLimiter(rate.Every(time.Minute/100), 100)
		sm.rateLimiters[clientIP] = limiter
	}
	return limiter
}

// getClientIP extracts real client IP
func (sm *SecurityMiddleware) getClientIP(c *gin.Context) string {
	// Check X-Forwarded-For header
	xff := c.GetHeader("X-Forwarded-For")
	if xff != "" {
		ips := strings.Split(xff, ",")
		return strings.TrimSpace(ips[0])
	}

	// Check X-Real-IP header
	xri := c.GetHeader("X-Real-IP")
	if xri != "" {
		return xri
	}

	// Fall back to remote address
	ip, _, _ := net.SplitHostPort(c.Request.RemoteAddr)
	return ip
}

// CSRF protection middleware
func (sm *SecurityMiddleware) CSRFProtection() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip CSRF for GET, HEAD, OPTIONS
		if c.Request.Method == "GET" || c.Request.Method == "HEAD" || c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		// Skip CSRF for public authentication and callback routes
		publicPaths := []string{
			"/api/v1/auth/login",
			"/api/v1/auth/register",
			"/api/v1/auth/forgot-password",
			"/api/v1/auth/reset-password",
			"/api/v1/bot/webhook",
			"/api/v1/hotspot/callback",
			"/health",
		}

		path := c.Request.URL.Path
		for _, p := range publicPaths {
			if strings.HasPrefix(path, p) {
				c.Next()
				return
			}
		}

		// Check CSRF token
		token := c.GetHeader("X-CSRF-Token")
		if token == "" {
			token = c.PostForm("_csrf_token")
		}

		if token == "" {
			c.JSON(http.StatusForbidden, gin.H{"error": "CSRF token required"})
			c.Abort()
			return
		}

		// Validate token (in production, validate against session)
		if len(token) < 32 {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid CSRF token"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// Input validation middleware
func (sm *SecurityMiddleware) ValidateInput() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Validate content length
		if c.Request.ContentLength > 10*1024*1024 { // 10MB limit
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Request too large"})
			c.Abort()
			return
		}

		// Validate content type
		contentType := c.GetHeader("Content-Type")
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "PATCH" {
			if !strings.Contains(contentType, "application/json") &&
				!strings.Contains(contentType, "multipart/form-data") &&
				!strings.Contains(contentType, "application/x-www-form-urlencoded") {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid content type"})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

// SQL injection protection middleware
func (sm *SecurityMiddleware) SQLInjectionProtection() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check for common SQL injection patterns
		dangerousPatterns := []string{
			"' OR '1'='1",
			"'; DROP TABLE",
			"--",
			"/*",
			"*/",
			"UNION SELECT",
			"EXEC(",
			"EXECUTE(",
			"CAST(",
			"CONVERT(",
		}

		// Check query parameters
		for _, values := range c.Request.URL.Query() {
			for _, value := range values {
				for _, pattern := range dangerousPatterns {
					if strings.Contains(strings.ToUpper(value), pattern) {
						sm.logSecurityEvent(c, "sql_injection_attempt", fmt.Sprintf("Pattern: %s in query param: %s", pattern, value))
						c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input detected"})
						c.Abort()
						return
					}
				}
			}
		}

		c.Next()
	}
}

// XSS protection middleware
func (sm *SecurityMiddleware) XSSProtection() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check for common XSS patterns
		xssPatterns := []string{
			"<script",
			"javascript:",
			"vbscript:",
			"onload=",
			"onerror=",
			"onclick=",
			"onmouseover=",
			"eval(",
			"alert(",
			"document.cookie",
			"window.location",
		}

		// Check form data
		if err := c.Request.ParseForm(); err == nil {
			for _, values := range c.Request.PostForm {
				for _, value := range values {
					for _, pattern := range xssPatterns {
						if strings.Contains(strings.ToLower(value), pattern) {
							sm.logSecurityEvent(c, "xss_attempt", fmt.Sprintf("Pattern: %s in form data", pattern))
							c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input detected"})
							c.Abort()
							return
						}
					}
				}
			}
		}

		c.Next()
	}
}

// API key validation middleware
func (sm *SecurityMiddleware) APIKeyAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-API-Key")
		if apiKey == "" {
			apiKey = c.Query("api_key")
		}

		if apiKey == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "API key required"})
			c.Abort()
			return
		}

		// Validate API key format (should be UUID format)
		if len(apiKey) != 36 || !strings.Contains(apiKey, "-") {
			sm.logSecurityEvent(c, "invalid_api_key", "Invalid API key format")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
			c.Abort()
			return
		}

		// In production, validate against database
		c.Set("api_key", apiKey)
		c.Next()
	}
}

// Security logging
func (sm *SecurityMiddleware) logSecurityEvent(c *gin.Context, eventType, details string) {
	// In production, log to security monitoring system
	fmt.Printf("[SECURITY] %s - %s - %s - %s - %s\n",
		time.Now().Format(time.RFC3339),
		eventType,
		sm.getClientIP(c),
		c.Request.URL.Path,
		details,
	)
}

// Request logging middleware
func (sm *SecurityMiddleware) RequestLogging() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("[GIN] %s | %s | %d | %s | %s | %s | %s\n",
			param.TimeStamp.Format("2006-01-02 15:04:05"),
			param.Method,
			param.StatusCode,
			param.Path,
			param.Latency,
			param.ClientIP,
			param.ErrorMessage,
		)
	})
}

// IP whitelist middleware (optional, for high-security environments)
func (sm *SecurityMiddleware) IPWhitelist(allowedIPs []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if len(allowedIPs) == 0 {
			c.Next()
			return
		}

		clientIP := sm.getClientIP(c)
		allowed := false

		// Always allow localhost in development
		if clientIP == "127.0.0.1" || clientIP == "::1" || clientIP == "localhost" {
			c.Next()
			return
		}

		for _, ip := range allowedIPs {
			if clientIP == ip || sm.ipMatchesCIDR(clientIP, ip) {
				allowed = true
				break
			}
		}

		if !allowed {
			sm.logSecurityEvent(c, "ip_blocked", fmt.Sprintf("IP not in whitelist: %s", clientIP))
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// ipMatchesCIDR checks if IP matches CIDR notation
func (sm *SecurityMiddleware) ipMatchesCIDR(clientIP, cidr string) bool {
	if !strings.Contains(cidr, "/") {
		return clientIP == cidr
	}

	_, ipNet, err := net.ParseCIDR(cidr)
	if err != nil {
		return false
	}

	ip := net.ParseIP(clientIP)
	return ipNet.Contains(ip)
}

// File upload security middleware
func (sm *SecurityMiddleware) SecureFileUpload() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get uploaded file
		file, err := c.FormFile("file")
		if err != nil {
			c.Next()
			return
		}

		// Validate file size (max 10MB)
		if file.Size > 10*1024*1024 {
			sm.logSecurityEvent(c, "oversized_upload", fmt.Sprintf("File too large: %d bytes", file.Size))
			c.JSON(http.StatusBadRequest, gin.H{"error": "File too large"})
			c.Abort()
			return
		}

		// Validate file type based on extension
		allowedExtensions := []string{".txt", ".json", ".yaml", ".yml", ".xml", ".csv"}
		allowed := false
		filename := strings.ToLower(file.Filename)

		for _, ext := range allowedExtensions {
			if strings.HasSuffix(filename, ext) {
				allowed = true
				break
			}
		}

		if !allowed {
			sm.logSecurityEvent(c, "invalid_file_type", fmt.Sprintf("Disallowed file extension: %s", filename))
			c.JSON(http.StatusBadRequest, gin.H{"error": "File type not allowed"})
			c.Abort()
			return
		}

		// Check for suspicious filenames
		suspiciousPatterns := []string{"..", "/", "\\", "<", ">", ":", "*", "?", "\"", "|"}
		for _, pattern := range suspiciousPatterns {
			if strings.Contains(filename, pattern) {
				sm.logSecurityEvent(c, "suspicious_filename", fmt.Sprintf("Suspicious pattern in filename: %s", filename))
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid filename"})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

// Environment validation middleware
func (sm *SecurityMiddleware) EnvironmentValidation() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Ensure we're not running in debug mode in production
		if gin.Mode() == gin.DebugMode {
			// Log warning but don't block (for development)
			sm.logSecurityEvent(c, "debug_mode_warning", "Application running in debug mode")
		}

		c.Next()
	}
}

// ApplyAllSecurityMiddleware applies all security middleware
func (sm *SecurityMiddleware) ApplyAllSecurityMiddleware(router *gin.Engine) {
	// Apply security middleware in order
	router.Use(sm.RequestLogging())
	router.Use(sm.SecurityHeaders())
	router.Use(sm.CORS())
	router.Use(sm.RateLimit())
	router.Use(sm.ValidateInput())
	router.Use(sm.SQLInjectionProtection())
	router.Use(sm.XSSProtection())
	router.Use(sm.EnvironmentValidation())

	// Apply CSRF protection only to authenticated routes
	// (will be applied per route group)
}
