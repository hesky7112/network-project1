package modules

import (
	"networking-main/internal/models"
)

// Aliases for types moved to internal/models to avoid circular dependencies
// between modules and finance/reporting.

type ExecutionMode = models.ExecutionMode

const (
	ExecutionServer  ExecutionMode = models.ExecutionServer
	ExecutionBrowser ExecutionMode = models.ExecutionBrowser
	ExecutionHybrid  ExecutionMode = models.ExecutionHybrid
)

type LicenseType = models.LicenseType

const (
	LicensePreview  LicenseType = models.LicensePreview
	LicenseLease    LicenseType = models.LicenseLease
	LicensePurchase LicenseType = models.LicensePurchase
)

type ModuleCategory = models.ModuleCategory

const (
	CategoryChurch     ModuleCategory = models.CategoryChurch
	CategorySchool     ModuleCategory = models.CategorySchool
	CategoryHealthcare ModuleCategory = models.CategoryHealthcare
	CategoryRetail     ModuleCategory = models.CategoryRetail
	CategoryBusiness   ModuleCategory = models.CategoryBusiness
	CategorySecurity   ModuleCategory = models.CategorySecurity
	CategoryAnalytics  ModuleCategory = models.CategoryAnalytics
	CategoryNetwork    ModuleCategory = models.CategoryNetwork
	CategoryEvents     ModuleCategory = models.CategoryEvents
	CategoryCompliance ModuleCategory = models.CategoryCompliance
)

type PrimitiveRef = models.PrimitiveRef
type Module = models.Module
type License = models.License
type ExecutionLog = models.ExecutionLog
type ModuleReview = models.ModuleReview
type ModuleStorage = models.ModuleStorage
type ScheduledJob = models.ScheduledJob
type ModuleWebhook = models.ModuleWebhook
type UserSecret = models.UserSecret
