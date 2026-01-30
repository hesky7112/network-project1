package models

import (
	"time"

	"gorm.io/gorm"
)

// ExecutionMode determines where the module runs
type ExecutionMode string

const (
	ExecutionServer  ExecutionMode = "server"  // Python process (performance)
	ExecutionBrowser ExecutionMode = "browser" // WASM/Pyodide (privacy premium)
	ExecutionHybrid  ExecutionMode = "hybrid"  // User chooses per run
)

// LicenseType defines how a module is sold
type LicenseType string

const (
	LicensePreview  LicenseType = "preview"  // 7-day trial
	LicenseLease    LicenseType = "lease"    // Monthly subscription
	LicensePurchase LicenseType = "purchase" // One-time buy
)

// ModuleCategory groups modules by vertical
type ModuleCategory string

const (
	CategoryChurch     ModuleCategory = "church"
	CategorySchool     ModuleCategory = "school"
	CategoryHealthcare ModuleCategory = "healthcare"
	CategoryRetail     ModuleCategory = "retail"
	CategoryBusiness   ModuleCategory = "business"
	CategorySecurity   ModuleCategory = "security"
	CategoryAnalytics  ModuleCategory = "analytics"
	CategoryNetwork    ModuleCategory = "network"
	CategoryEvents     ModuleCategory = "events"
	CategoryCompliance ModuleCategory = "compliance"
)

// PrimitiveRef references a master primitive and its config
type PrimitiveRef struct {
	Module string                 `json:"module" gorm:"size:100"` // e.g., "DocumentIntelligence"
	Method string                 `json:"method" gorm:"size:100"` // e.g., "extract_text"
	Config map[string]interface{} `json:"config" gorm:"serializer:json"`
}

// Module is a sellable mini-app definition
type Module struct {
	ID          string         `json:"id" gorm:"primaryKey;size:100"`
	Name        string         `json:"name" gorm:"size:255;not null"`
	Description string         `json:"description" gorm:"type:text"`
	Category    ModuleCategory `json:"category" gorm:"size:50"`
	Version     string         `json:"version" gorm:"size:20;default:'1.0.0'"`

	// Pricing
	Price       float64     `json:"price"`
	LicenseType LicenseType `json:"license_type" gorm:"size:20"`
	IsPublished bool        `json:"is_published" gorm:"default:false"`

	// Execution
	ExecutionMode ExecutionMode          `json:"execution_mode" gorm:"size:20;default:'hybrid'"`
	Primitives    []PrimitiveRef         `json:"primitives" gorm:"serializer:json"`
	UITemplate    string                 `json:"ui_template" gorm:"size:255"`      // Marimo file path
	UISchema      map[string]interface{} `json:"ui_schema" gorm:"serializer:json"` // Dynamic UI definition

	// Metadata
	Author  string   `json:"author" gorm:"size:100"`
	IconURL string   `json:"icon_url" gorm:"size:500"`
	Tags    []string `json:"tags" gorm:"serializer:json"`

	// Compatibility
	RequiresHAL bool     `json:"requires_hal"`                      // Needs NFC/biometrics
	RequiresGPU bool     `json:"requires_gpu"`                      // Needs CUDA (MONAI)
	AuraTypes   []string `json:"aura_types" gorm:"serializer:json"` // Compatible auras

	// Stats
	Downloads int64   `json:"downloads" gorm:"default:0"`
	Rating    float64 `json:"rating" gorm:"default:0"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// License tracks user access to modules
type License struct {
	ID       uint        `json:"id" gorm:"primaryKey"`
	UserID   uint        `json:"user_id" gorm:"index"`
	ModuleID string      `json:"module_id" gorm:"index;size:100"`
	Type     LicenseType `json:"type" gorm:"size:20"`

	// Validity
	StartsAt  time.Time  `json:"starts_at"`
	ExpiresAt *time.Time `json:"expires_at"` // nil = forever (purchase)

	// Usage limits (preview mode)
	MaxExecutions  *int `json:"max_executions"`
	ExecutionCount int  `json:"execution_count" gorm:"default:0"`

	// Payment
	TransactionID string  `json:"transaction_id" gorm:"size:100"`
	AmountPaid    float64 `json:"amount_paid"`

	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
}

// ExecutionLog tracks module runs for analytics/billing
type ExecutionLog struct {
	ID        uint   `json:"id" gorm:"primaryKey"`
	UserID    uint   `json:"user_id" gorm:"index"`
	ModuleID  string `json:"module_id" gorm:"index;size:100"`
	LicenseID uint   `json:"license_id"`

	ExecutionMode ExecutionMode `json:"execution_mode" gorm:"size:20"`
	Status        string        `json:"status" gorm:"size:20"` // pending, running, success, failed

	InputSize  int64 `json:"input_size"`  // bytes
	OutputSize int64 `json:"output_size"` // bytes
	DurationMs int64 `json:"duration_ms"`

	Error     string    `json:"error" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at"`
}

// ModuleReview stores user ratings and feedback
type ModuleReview struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index"`
	ModuleID  string    `json:"module_id" gorm:"index;size:100"`
	Rating    int       `json:"rating" gorm:"check:rating >= 1 AND rating <= 5"`
	Comment   string    `json:"comment" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at"`
}

// ModuleStorage provides persistent KV storage for modules
type ModuleStorage struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	ModuleID  string    `json:"module_id" gorm:"index;size:100;not null;uniqueIndex:idx_storage_key"`
	UserID    uint      `json:"user_id" gorm:"index;not null;uniqueIndex:idx_storage_key"`
	Key       string    `json:"key" gorm:"size:255;not null;uniqueIndex:idx_storage_key"`
	Value     string    `json:"value" gorm:"type:text"` // JSON payload
	IsPublic  bool      `json:"is_public" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ScheduledJob defines an automated module execution
type ScheduledJob struct {
	ID        uint                   `json:"id" gorm:"primaryKey"`
	UserID    uint                   `json:"user_id" gorm:"index"`
	ModuleID  string                 `json:"module_id" gorm:"size:100;not null"`
	Schedule  string                 `json:"schedule" gorm:"size:100"` // "10m", "1h", or "*/5 * * * *" (simple)
	Input     map[string]interface{} `json:"input" gorm:"serializer:json"`
	IsEnabled bool                   `json:"is_enabled" gorm:"default:true"`

	LastRunAt *time.Time `json:"last_run_at"`
	NextRunAt time.Time  `json:"next_run_at" gorm:"index"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ModuleWebhook maps an external URL slug to a module execution
type ModuleWebhook struct {
	ID        uint                   `json:"id" gorm:"primaryKey"`
	UserID    uint                   `json:"user_id" gorm:"index"`
	ModuleID  string                 `json:"module_id" gorm:"size:100;not null"`
	Slug      string                 `json:"slug" gorm:"size:100;uniqueIndex;not null"` // e.g. "my-hook-123"
	Input     map[string]interface{} `json:"input" gorm:"serializer:json"`              // Default input
	IsEnabled bool                   `json:"is_enabled" gorm:"default:true"`
	CreatedAt time.Time              `json:"created_at"`
}

// UserSecret stores encrypted API keys (e.g. OPENAI_API_KEY)
type UserSecret struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index;uniqueIndex:idx_user_secret"`
	Key       string    `json:"key" gorm:"size:255;not null;uniqueIndex:idx_user_secret"`
	Value     string    `json:"-" gorm:"type:text"` // Encrypted value (never returned in JSON)
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
