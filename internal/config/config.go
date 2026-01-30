package config

import (
	"errors"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	// Server Configuration
	Port        string
	DatabaseURL string
	RedisURL    string

	// Security Configuration
	Security *SecurityConfig

	// Feature Flags
	EnableOnboarding bool
	EnableHealth     bool
	EnableTopology   bool
	EnableReporting  bool
	EnableStaff      bool

	// Hotspot & Daraja
	Hotspot *HotspotConfig
	Daraja  *DarajaConfig
}

type SecurityConfig struct {
	// JWT Configuration
	JWTSecret     string
	JWTExpiration time.Duration

	// Session Configuration
	SessionMaxAge   time.Duration
	SessionSecure   bool
	SessionHTTPOnly bool
	SessionSameSite string

	// Rate Limiting
	RateLimitRequests int
	RateLimitWindow   time.Duration

	// CORS Configuration
	AllowedOrigins []string
	AllowedMethods []string
	AllowedHeaders []string

	// Security Headers
	EnableHSTS    bool
	HSTSMaxAge    time.Duration
	CSPDirectives string

	// Password Policy
	MinPasswordLength int
	MaxPasswordLength int
	RequireUppercase  bool
	RequireLowercase  bool
	RequireNumbers    bool
	RequireSpecial    bool

	// API Security
	APIKeyRequired bool
	CSRFProtection bool
	ValidateInput  bool

	// Audit Logging
	AuditLogEnabled bool
	AuditLogPath    string

	// IP Restrictions
	EnableIPWhitelist bool
	AllowedIPs        []string

	// TLS Configuration
	TLSEnabled    bool
	TLSCertPath   string
	TLSKeyPath    string
	TLSMinVersion string

	// File Upload
	MaxFileSize      int64
	AllowedFileTypes []string
}

type HotspotConfig struct {
	EnableHotspot bool
	RadiusSecret  string
	RadiusAddr    string
}

type DarajaConfig struct {
	ConsumerKey    string
	ConsumerSecret string
	PassKey        string
	ShortCode      string
	CallbackURL    string
	Mode           string
}

func Load() *Config {
	return &Config{
		// Server Configuration
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://user:password@localhost/networking?sslmode=disable"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),

		// Security Configuration
		Security: loadSecurityConfig(),

		// Feature Flags
		EnableOnboarding: getEnvBool("ENABLE_ONBOARDING", true),
		EnableHealth:     getEnvBool("ENABLE_HEALTH", true),
		EnableTopology:   getEnvBool("ENABLE_TOPOLOGY", true),
		EnableReporting:  getEnvBool("ENABLE_REPORTING", true),
		EnableStaff:      getEnvBool("ENABLE_STAFF", true),

		// Hotspot & Daraja
		Hotspot: &HotspotConfig{
			EnableHotspot: getEnvBool("ENABLE_HOTSPOT", true),
			RadiusSecret:  getEnv("RADIUS_SECRET", "testing123"),
			RadiusAddr:    getEnv("RADIUS_ADDR", ":1812"),
		},
		Daraja: &DarajaConfig{
			ConsumerKey:    getEnv("DARAJA_CONSUMER_KEY", "your_key"),
			ConsumerSecret: getEnv("DARAJA_CONSUMER_SECRET", "your_secret"),
			PassKey:        getEnv("DARAJA_PASSKEY", "your_passkey"),
			ShortCode:      getEnv("DARAJA_SHORTCODE", "174379"),
			CallbackURL:    getEnv("DARAJA_CALLBACK_URL", "https://your-domain.com/api/v1/hotspot/callback"),
			Mode:           getEnv("DARAJA_MODE", "sandbox"),
		},
	}
}

func loadSecurityConfig() *SecurityConfig {
	return &SecurityConfig{
		// JWT
		JWTSecret:     getEnv("JWT_SECRET", "your-super-secret-key-change-in-production"),
		JWTExpiration: getEnvDuration("JWT_EXPIRATION", "24h"),

		// Session
		SessionMaxAge:   getEnvDuration("SESSION_MAX_AGE", "24h"),
		SessionSecure:   getEnvBool("SESSION_SECURE", true),
		SessionHTTPOnly: getEnvBool("SESSION_HTTP_ONLY", true),
		SessionSameSite: getEnv("SESSION_SAME_SITE", "strict"),

		// Rate Limiting
		RateLimitRequests: getEnvInt("RATE_LIMIT_REQUESTS", 100),
		RateLimitWindow:   getEnvDuration("RATE_LIMIT_WINDOW", "1m"),

		// CORS
		AllowedOrigins: getEnvSlice("ALLOWED_ORIGINS", []string{
			"http://localhost:3000",
			"http://localhost:8080",
			"https://localhost:3000",
			"https://localhost:8080",
		}),
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{
			"Origin", "Content-Type", "Accept", "Authorization",
			"X-Requested-With", "X-CSRF-Token", "X-API-Key",
		},

		// Security Headers
		EnableHSTS:    getEnvBool("ENABLE_HSTS", true),
		HSTSMaxAge:    getEnvDuration("HSTS_MAX_AGE", "31536000s"), // 1 year
		CSPDirectives: getEnv("CSP_DIRECTIVES", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' ws: wss:;"),

		// Password Policy
		MinPasswordLength: getEnvInt("MIN_PASSWORD_LENGTH", 12),
		MaxPasswordLength: getEnvInt("MAX_PASSWORD_LENGTH", 128),
		RequireUppercase:  getEnvBool("REQUIRE_UPPERCASE", true),
		RequireLowercase:  getEnvBool("REQUIRE_LOWERCASE", true),
		RequireNumbers:    getEnvBool("REQUIRE_NUMBERS", true),
		RequireSpecial:    getEnvBool("REQUIRE_SPECIAL", true),

		// API Security
		APIKeyRequired: getEnvBool("API_KEY_REQUIRED", false),
		CSRFProtection: getEnvBool("CSRF_PROTECTION", true),
		ValidateInput:  getEnvBool("VALIDATE_INPUT", true),

		// Audit Logging
		AuditLogEnabled: getEnvBool("AUDIT_LOG_ENABLED", true),
		AuditLogPath:    getEnv("AUDIT_LOG_PATH", "./logs/audit.log"),

		// IP Restrictions
		EnableIPWhitelist: getEnvBool("ENABLE_IP_WHITELIST", false),
		AllowedIPs:        getEnvSlice("ALLOWED_IPS", []string{}),

		// TLS Configuration
		TLSEnabled:    getEnvBool("TLS_ENABLED", false),
		TLSCertPath:   getEnv("TLS_CERT_PATH", "./certs/server.crt"),
		TLSKeyPath:    getEnv("TLS_KEY_PATH", "./certs/server.key"),
		TLSMinVersion: getEnv("TLS_MIN_VERSION", "1.2"),

		// File Upload
		MaxFileSize:      getEnvInt64("MAX_FILE_SIZE", 10*1024*1024), // 10MB
		AllowedFileTypes: getEnvSlice("ALLOWED_FILE_TYPES", []string{".txt", ".json", ".yaml", ".yml", ".xml", ".csv"}),
	}
}

// Validate validates the configuration
func (c *Config) Validate() error {
	if err := c.Security.ValidateSecurityConfig(); err != nil {
		return err
	}

	if c.Port == "" {
		return errors.New("PORT cannot be empty")
	}

	if c.DatabaseURL == "" {
		return errors.New("DATABASE_URL cannot be empty")
	}

	return nil
}

// ValidateSecurityConfig validates security configuration
func (sc *SecurityConfig) ValidateSecurityConfig() error {
	if len(sc.JWTSecret) < 32 {
		return errors.New("JWT_SECRET must be at least 32 characters long")
	}

	if sc.MinPasswordLength < 8 {
		return errors.New("MIN_PASSWORD_LENGTH must be at least 8")
	}

	if sc.MaxPasswordLength < sc.MinPasswordLength {
		return errors.New("MAX_PASSWORD_LENGTH must be greater than MIN_PASSWORD_LENGTH")
	}

	if sc.RateLimitRequests <= 0 {
		return errors.New("RATE_LIMIT_REQUESTS must be greater than 0")
	}

	if len(sc.AllowedOrigins) == 0 {
		return errors.New("ALLOWED_ORIGINS cannot be empty")
	}

	// TLS Configuration validation
	if sc.TLSEnabled {
		if sc.TLSCertPath == "" {
			return errors.New("TLS_CERT_PATH cannot be empty when TLS is enabled")
		}
		if sc.TLSKeyPath == "" {
			return errors.New("TLS_KEY_PATH cannot be empty when TLS is enabled")
		}
		if sc.TLSMinVersion != "1.0" && sc.TLSMinVersion != "1.1" && sc.TLSMinVersion != "1.2" && sc.TLSMinVersion != "1.3" {
			return errors.New("TLS_MIN_VERSION must be one of: 1.0, 1.1, 1.2, 1.3")
		}
	}

	return nil
}

// Helper functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if b, err := strconv.ParseBool(value); err == nil {
			return b
		}
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return defaultValue
}

func getEnvInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.ParseInt(value, 10, 64); err == nil {
			return i
		}
	}
	return defaultValue
}

func getEnvDuration(key, defaultValue string) time.Duration {
	if value := os.Getenv(key); value != "" {
		if d, err := time.ParseDuration(value); err == nil {
			return d
		}
	}
	d, _ := time.ParseDuration(defaultValue)
	return d
}

func getEnvSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		// Simple comma-separated parsing
		// In production, use more sophisticated parsing
		return strings.Split(value, ",")
	}
	return defaultValue
}
