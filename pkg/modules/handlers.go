package modules

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"networking-main/internal/models"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"networking-main/pkg/finance"
	"networking-main/pkg/pdf"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Handlers handles all module-related HTTP requests
type Handlers struct {
	db               *gorm.DB
	registry         *Registry
	licenseManager   *LicenseManager
	spawner          *Spawner
	scheduler        *Scheduler
	financeService   *finance.Service
	packagesDir      string
	modulesEngineURL string
	pdfService       *pdf.Service
}

// NewHandlers creates a new Handlers instance
func NewHandlers(db *gorm.DB, financeService *finance.Service) *Handlers {
	registry := NewRegistry(db)
	licenseManager := NewLicenseManager(db)
	spawner := NewSpawner(registry, licenseManager)
	scheduler := NewScheduler(db, spawner)

	// Start the scheduler
	scheduler.Start()

	return &Handlers{
		db:               db,
		registry:         registry,
		licenseManager:   licenseManager,
		spawner:          spawner,
		scheduler:        scheduler,
		financeService:   financeService,
		packagesDir:      os.Getenv("MODULES_PACKAGES_DIR"),
		modulesEngineURL: os.Getenv("MODULES_ENGINE_URL"),
		pdfService:       pdf.NewService(filepath.Join(os.TempDir(), "pdf_ops")),
	}
}

// ========== Module CRUD ==========

// ListModules returns all available modules
func (h *Handlers) ListModules(c *gin.Context) {
	category := c.Query("category")
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize

	if search != "" {
		modules, err := h.registry.SearchModules(search, true, pageSize)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search modules"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"modules":   modules,
			"total":     len(modules),
			"page":      page,
			"page_size": pageSize,
		})
		return
	}

	modules, total, err := h.registry.ListModules(ModuleCategory(category), true, pageSize, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch modules"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"modules":   modules,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
		"pages":     (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

// GetModule returns a single module by ID
func (h *Handlers) GetModule(c *gin.Context) {
	id := c.Param("id")

	module, err := h.registry.GetModule(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Module not found"})
		return
	}

	c.JSON(http.StatusOK, module)
}

// GetModuleUI returns the UI schema for a module
func (h *Handlers) GetModuleUI(c *gin.Context) {
	id := c.Param("id")

	module, err := h.registry.GetModule(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Module not found"})
		return
	}

	c.JSON(http.StatusOK, module.UISchema)
}

// GetModuleStats returns usage statistics for a module
func (h *Handlers) GetModuleStats(c *gin.Context) {
	id := c.Param("id")

	var stats struct {
		TotalExecutions int64   `json:"total_executions"`
		UniqueUsers     int64   `json:"unique_users"`
		AvgDurationMs   float64 `json:"avg_duration_ms"`
		SuccessRate     float64 `json:"success_rate"`
	}

	h.db.Model(&ExecutionLog{}).Where("module_id = ?", id).Count(&stats.TotalExecutions)
	h.db.Model(&ExecutionLog{}).Where("module_id = ?", id).Distinct("user_id").Count(&stats.UniqueUsers)

	h.db.Model(&ExecutionLog{}).Where("module_id = ?", id).
		Select("AVG(duration_ms)").Scan(&stats.AvgDurationMs)

	var successCount int64
	h.db.Model(&ExecutionLog{}).Where("module_id = ? AND status = ?", id, "success").Count(&successCount)
	if stats.TotalExecutions > 0 {
		stats.SuccessRate = float64(successCount) / float64(stats.TotalExecutions) * 100
	}

	c.JSON(http.StatusOK, stats)
}

// GetFeaturedModules returns featured/promoted modules
func (h *Handlers) GetFeaturedModules(c *gin.Context) {
	modules, _, err := h.registry.ListModules("", true, 10, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch modules"})
		return
	}
	c.JSON(http.StatusOK, modules)
}

// GetCategories returns all available module categories
func (h *Handlers) GetCategories(c *gin.Context) {
	categories := []gin.H{
		{"id": "church", "name": "Church & Religious", "icon": "⛪"},
		{"id": "school", "name": "Education", "icon": "🎓"},
		{"id": "healthcare", "name": "Healthcare", "icon": "🏥"},
		{"id": "retail", "name": "Retail & Business", "icon": "🛒"},
		{"id": "business", "name": "Enterprise", "icon": "🏢"},
		{"id": "security", "name": "Security", "icon": "🔒"},
		{"id": "analytics", "name": "Analytics", "icon": "📊"},
		{"id": "network", "name": "Network", "icon": "🌐"},
		{"id": "events", "name": "Events", "icon": "🎫"},
		{"id": "compliance", "name": "Compliance", "icon": "✅"},
	}
	c.JSON(http.StatusOK, categories)
}

// ========== Licensing ==========

// StartPreview starts a preview license for a module
func (h *Handlers) StartPreview(c *gin.Context) {
	moduleID := c.Param("id")
	userID := c.GetUint("user_id")

	_, err := h.registry.GetModule(moduleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Module not found"})
		return
	}

	license, err := h.licenseManager.CreatePreviewLicense(userID, moduleID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"license":        license,
		"message":        "Preview started successfully",
		"expires_at":     license.ExpiresAt,
		"max_executions": license.MaxExecutions,
	})
}

// PurchaseLicense purchases a license for a module
func (h *Handlers) PurchaseLicense(c *gin.Context) {
	moduleID := c.Param("id")
	userID := c.GetUint("user_id")

	// Check if monetization is enabled
	var monetizationEnabled = false
	var setting models.SystemSetting
	if err := h.db.Where("key = ?", "monetization_enabled").First(&setting).Error; err == nil {
		if setting.Value == "true" {
			monetizationEnabled = true
		}
	}

	var req struct {
		LicenseType string `json:"license_type" binding:"required"` // lease or purchase
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	module, err := h.registry.GetModule(moduleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Module not found"})
		return
	}

	// Force price to 0 if monetization is disabled
	price := module.Price
	if !monetizationEnabled {
		price = 0
	}

	// Process Payment via Wallet
	var transactionID string
	if price > 0 {
		txn, err := h.financeService.Purchase(c.Request.Context(), userID, price, "Module Purchase: "+module.Name, moduleID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Payment failed: " + err.Error()})
			return
		}
		transactionID = fmt.Sprintf("txn_%d", txn.ID)
	} else {
		transactionID = fmt.Sprintf("free_%d_%d", userID, time.Now().Unix())
	}

	var license *License

	switch req.LicenseType {
	case "lease":
		license, err = h.licenseManager.CreateLeaseLicense(userID, moduleID, transactionID, price)
	case "purchase":
		license, err = h.licenseManager.CreatePurchaseLicense(userID, moduleID, transactionID, price)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid license type"})
		return
	}

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"license": license,
		"message": "License created successfully",
	})
}

// GetUserLicenses returns all licenses for the current user
func (h *Handlers) GetUserLicenses(c *gin.Context) {
	userID := c.GetUint("user_id")

	licenses, err := h.licenseManager.GetUserLicenses(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch licenses"})
		return
	}

	c.JSON(http.StatusOK, licenses)
}

// ValidateLicense checks if a license is valid
func (h *Handlers) ValidateLicense(c *gin.Context) {
	userID := c.GetUint("user_id")
	moduleID := c.Param("id")

	valid, reason := h.licenseManager.CanExecute(userID, moduleID)

	c.JSON(http.StatusOK, gin.H{
		"valid":     valid,
		"module_id": moduleID,
		"reason":    reason,
	})
}

// ========== Module Execution ==========

// ExecuteModule executes a module with given inputs
func (h *Handlers) ExecuteModule(c *gin.Context) {
	moduleID := c.Param("id")
	userID := c.GetUint("user_id")

	var req struct {
		Inputs        map[string]interface{} `json:"inputs"`
		ExecutionMode string                 `json:"execution_mode"` // server or browser
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Validate license
	valid, reason := h.licenseManager.CanExecute(userID, moduleID)
	if !valid {
		c.JSON(http.StatusForbidden, gin.H{"error": reason})
		return
	}

	// Get license (just validate it exists, spawner handles increment)

	// Build execution request
	execReq := &ExecutionRequest{
		UserID:        userID,
		ModuleID:      moduleID,
		ExecutionMode: ExecutionMode(req.ExecutionMode),
		Input:         req.Inputs,
	}

	// Execute via spawner
	result, err := h.spawner.Execute(execReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.registry.IncrementDownloads(moduleID)

	c.JSON(http.StatusOK, result)
}

// GetExecutionLogs returns execution history for a user
func (h *Handlers) GetExecutionLogs(c *gin.Context) {
	userID := c.GetUint("user_id")

	var logs []ExecutionLog
	if err := h.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(100).
		Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logs"})
		return
	}

	c.JSON(http.StatusOK, logs)
}

// ========== Package Download ==========

// DownloadPackage downloads a module package
func (h *Handlers) DownloadPackage(c *gin.Context) {
	moduleID := c.Param("id")
	userID := c.GetUint("user_id")
	format := c.DefaultQuery("format", "alienmodule")

	// Validate license
	valid, reason := h.licenseManager.CanExecute(userID, moduleID)
	if !valid {
		c.JSON(http.StatusForbidden, gin.H{"error": reason})
		return
	}

	// Find package file
	packagesDir := h.packagesDir
	if packagesDir == "" {
		packagesDir = "./packages"
	}

	var filename string
	if format == "wasm" {
		filename = filepath.Join(packagesDir, moduleID+".wasm.zip")
	} else {
		filename = filepath.Join(packagesDir, moduleID+".alienmodule")
	}

	if _, err := os.Stat(filename); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Package not found"})
		return
	}

	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filepath.Base(filename)))
	c.File(filename)
}

// GetBrowserBundle returns the WASM bundle data for browser execution
func (h *Handlers) GetBrowserBundle(c *gin.Context) {
	moduleID := c.Param("id")
	userID := c.GetUint("user_id")

	// Validate license
	valid, reason := h.licenseManager.CanExecute(userID, moduleID)
	if !valid {
		c.JSON(http.StatusForbidden, gin.H{"error": reason})
		return
	}

	module, err := h.registry.GetModule(moduleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Module not found"})
		return
	}

	bundleData := gin.H{
		"module_id":  moduleID,
		"name":       module.Name,
		"primitives": module.Primitives,
		"version":    module.Version,
	}

	c.JSON(http.StatusOK, bundleData)
}

// GetWasmBundle generates and returns the standalone WASM HTML for a module
func (h *Handlers) GetWasmBundle(c *gin.Context) {
	moduleID := c.Param("id")
	userID := c.GetUint("user_id")

	// Validate license
	valid, reason := h.licenseManager.CanExecute(userID, moduleID)
	if !valid {
		c.JSON(http.StatusForbidden, gin.H{"error": reason})
		return
	}

	module, err := h.registry.GetModule(moduleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Module not found"})
		return
	}

	// Call Python Engine to Export
	// Ideally we pass the script logic. For now, we assume the UI Template IS the script.
	// If UITemplate is a file path, we need to read it.

	// Simplification: We'll construct a simple Marimo script based on primitives if no template
	// Or we read the template file.
	scriptContent := ""
	if module.UITemplate != "" {
		// Map "modules/branded.py" -> "modules-engine/templates/branded.py"
		templateName := filepath.Base(module.UITemplate)
		// Assume templates are stored in modules-engine/templates relative to execution root
		templatePath := filepath.Join("modules-engine", "templates", templateName)

		content, err := os.ReadFile(templatePath)
		if err == nil {
			scriptContent = string(content)
		} else {
			// Fallback if template missing
			fmt.Printf("Failed to read template %s: %v\n", templatePath, err)
			scriptContent = fmt.Sprintf(`import marimo as mo
mo.md("# %s")
mo.md("Failed to load template: %s")
`, module.Name, err.Error())
		}
	}

	payload := map[string]interface{}{
		"module_id": moduleID,
		"input": map[string]interface{}{
			"script": scriptContent,
		},
		"primitives": []interface{}{},
	}

	resp, err := h.callModulesEngine("/active/export/wasm", payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Export failed: " + err.Error()})
		return
	}

	if success, ok := resp["success"].(bool); !ok || !success {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Export failed in engine"})
		return
	}

	output, _ := resp["output"].(map[string]interface{})
	html, _ := output["html"].(string)

	c.Header("Content-Type", "text/html")
	c.String(http.StatusOK, html)
}

// ========== Reviews ==========

// SubmitReview submits a review for a module
func (h *Handlers) SubmitReview(c *gin.Context) {
	moduleID := c.Param("id")
	userID := c.GetUint("user_id")

	var req struct {
		Rating  int    `json:"rating" binding:"required,min=1,max=5"`
		Comment string `json:"comment"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	review := ModuleReview{
		ModuleID:  moduleID,
		UserID:    userID,
		Rating:    req.Rating,
		Comment:   req.Comment,
		CreatedAt: time.Now(),
	}

	if err := h.registry.AddReview(&review); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit review"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"review":  review,
		"message": "Review submitted successfully",
	})
}

// GetModuleReviews returns all reviews for a module
func (h *Handlers) GetModuleReviews(c *gin.Context) {
	moduleID := c.Param("id")

	reviews, err := h.registry.GetReviews(moduleID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}

	c.JSON(http.StatusOK, reviews)
}

// ========== Admin ==========

// CreateModule creates a new module (authenticated users)
func (h *Handlers) CreateModule(c *gin.Context) {
	userID := c.GetUint("user_id")

	var module Module
	if err := c.ShouldBindJSON(&module); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Enforce Authorship
	// We might fetch the user name here if we had a User model access handy
	// For now, we'll try to set the Author field if it's empty, or override it.
	// We'll set a temporary author name based on ID if we can't find the real one easily,
	// or assume the frontend sends the name. But better to be safe.
	// Let's assume the Registry handles basic validation, but we need to ensure the ID is valid.

	// Auto-generate ID if missing
	if module.ID == "" {
		// specific simplified slug generation
		module.ID = fmt.Sprintf("mod-%d-%d", userID, time.Now().Unix())
	}

	// Enforce Pricing Rules
	// If monetization is OFF -> Price must be 0
	var monetizationEnabled = false
	var setting models.SystemSetting
	if err := h.db.Where("key = ?", "monetization_enabled").First(&setting).Error; err == nil {
		if setting.Value == "true" {
			monetizationEnabled = true
		}
	}

	if !monetizationEnabled {
		module.Price = 0
	} else if module.Price < 0 {
		// Prevent negative prices
		module.Price = 0
	}

	// Set defaults
	if module.Version == "" {
		module.Version = "0.0.1"
	}

	if err := h.registry.ValidateModule(&module); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.registry.CreateModule(&module); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create module"})
		return
	}

	c.JSON(http.StatusCreated, module)
}

// UpdateModule updates a module (admin only)
func (h *Handlers) UpdateModule(c *gin.Context) {
	id := c.Param("id")

	module, err := h.registry.GetModule(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Module not found"})
		return
	}

	if err := c.ShouldBindJSON(module); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := h.registry.UpdateModule(module); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update module"})
		return
	}

	c.JSON(http.StatusOK, module)
}

// DeleteModule deletes a module (admin only)
func (h *Handlers) DeleteModule(c *gin.Context) {
	id := c.Param("id")

	if err := h.registry.DeleteModule(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete module"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Module deleted"})
}

// PublishModule toggles the visibility of a module in the marketplace
func (h *Handlers) PublishModule(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Published bool `json:"published"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := h.registry.PublishModule(id, req.Published); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update module status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Module status updated", "published": req.Published})
}

// UploadPackage uploads a module package (admin only)
func (h *Handlers) UploadPackage(c *gin.Context) {
	moduleID := c.Param("id")

	file, header, err := c.Request.FormFile("package")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	packagesDir := h.packagesDir
	if packagesDir == "" {
		packagesDir = "./packages"
	}
	os.MkdirAll(packagesDir, 0755)

	ext := filepath.Ext(header.Filename)
	destPath := filepath.Join(packagesDir, moduleID+ext)

	dest, err := os.Create(destPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save package"})
		return
	}
	defer dest.Close()

	_, err = io.Copy(dest, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write package"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Package uploaded successfully",
		"path":    destPath,
		"size":    header.Size,
	})
}

// ========== Health/Status ==========

// GetEngineStatus returns the status of the modules-engine
func (h *Handlers) GetEngineStatus(c *gin.Context) {
	engineURL := h.modulesEngineURL
	if engineURL == "" {
		engineURL = "http://localhost:8001"
	}

	resp, err := http.Get(engineURL + "/health")
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "unavailable",
			"error":  err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	var health map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&health)

	c.JSON(http.StatusOK, gin.H{
		"status":        "available",
		"engine_health": health,
	})
}

// GetPrimitives returns available primitives from modules-engine
func (h *Handlers) GetPrimitives(c *gin.Context) {
	engineURL := h.modulesEngineURL
	if engineURL == "" {
		engineURL = "http://localhost:8001"
	}

	resp, err := http.Get(engineURL + "/primitives")
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Modules engine unavailable"})
		return
	}
	defer resp.Body.Close()

	var primitives interface{}
	json.NewDecoder(resp.Body).Decode(&primitives)

	c.JSON(http.StatusOK, primitives)
}

// callModulesEngine makes a request to the Python modules-engine
func (h *Handlers) callModulesEngine(endpoint string, payload interface{}) (map[string]interface{}, error) {
	engineURL := h.modulesEngineURL
	if engineURL == "" {
		engineURL = "http://localhost:8001"
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	resp, err := http.Post(
		engineURL+endpoint,
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result, nil
}

// ========== Storage (Phase 1) ==========

// SetStorageValue saves a key-value pair
func (h *Handlers) SetStorageValue(c *gin.Context) {
	moduleID := c.Param("id")
	key := c.Param("key")
	userID := c.GetUint("user_id")

	var req struct {
		Value    string `json:"value" binding:"required"`
		IsPublic bool   `json:"is_public"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Verify license/ownership (optional, but good practice)
	// For now, any user with a license can store data for themselves in this module.
	if valid, _ := h.licenseManager.CanExecute(userID, moduleID); !valid {
		c.JSON(http.StatusForbidden, gin.H{"error": "No active license for this module"})
		return
	}

	if err := h.registry.SetStorage(userID, moduleID, key, req.Value, req.IsPublic); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data saved"})
}

// GetStorageValue retrieves a key-value pair
func (h *Handlers) GetStorageValue(c *gin.Context) {
	moduleID := c.Param("id")
	key := c.Param("key")
	userID := c.GetUint("user_id")

	// Check if user has license
	if valid, _ := h.licenseManager.CanExecute(userID, moduleID); !valid {
		c.JSON(http.StatusForbidden, gin.H{"error": "No active license for this module"})
		return
	}

	data, err := h.registry.GetStorage(userID, moduleID, key)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Key not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"value": data.Value, "is_public": data.IsPublic})
}

// ListStorageValues lists all keys for the user/module
func (h *Handlers) ListStorageValues(c *gin.Context) {
	moduleID := c.Param("id")
	userID := c.GetUint("user_id")

	if valid, _ := h.licenseManager.CanExecute(userID, moduleID); !valid {
		c.JSON(http.StatusForbidden, gin.H{"error": "No active license for this module"})
		return
	}

	items, err := h.registry.ListStorage(userID, moduleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list data"})
		return
	}

	// Transform to simple map
	kv := make(map[string]string)
	for _, item := range items {
		kv[item.Key] = item.Value
	}

	c.JSON(http.StatusOK, kv)
}

// DeleteStorageValue removes a key
func (h *Handlers) DeleteStorageValue(c *gin.Context) {
	moduleID := c.Param("id")
	key := c.Param("key")
	userID := c.GetUint("user_id")

	if valid, _ := h.licenseManager.CanExecute(userID, moduleID); !valid {
		c.JSON(http.StatusForbidden, gin.H{"error": "No active license for this module"})
		return
	}

	if err := h.registry.DeleteStorage(userID, moduleID, key); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data deleted"})
}

// ========== Automation (Phase 2) ==========

// CreateScheduledJob creates a new cron/interval job
func (h *Handlers) CreateScheduledJob(c *gin.Context) {
	moduleID := c.Param("id")
	userID := c.GetUint("user_id")

	var req struct {
		Schedule string                 `json:"schedule" binding:"required"`
		Input    map[string]interface{} `json:"input"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if valid, _ := h.licenseManager.CanExecute(userID, moduleID); !valid {
		c.JSON(http.StatusForbidden, gin.H{"error": "No active license for this module"})
		return
	}

	// Validate schedule (basic check)
	// In production, we should dry-run calculateNextRun here
	if req.Schedule == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Schedule is required"})
		return
	}

	job := ScheduledJob{
		UserID:    userID,
		ModuleID:  moduleID,
		Schedule:  req.Schedule,
		Input:     req.Input,
		IsEnabled: true,
		NextRunAt: time.Now(), // Run immediately or next interval? Let's say next interval logic handles it, or immediate.
		// Actually, let's set NextRunAt to Now so it runs ASAP, or calculate it.
		// For consistency, let's just default to Now so scheduler picks it up next tick.
	}
	job.NextRunAt = calculateNextRun(req.Schedule, time.Now())

	if err := h.db.Create(&job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create job"})
		return
	}

	c.JSON(http.StatusCreated, job)
}

// ListScheduledJobs returns jobs for a module
func (h *Handlers) ListScheduledJobs(c *gin.Context) {
	moduleID := c.Param("id")
	userID := c.GetUint("user_id")

	var jobs []ScheduledJob
	if err := h.db.Where("user_id = ? AND module_id = ?", userID, moduleID).Find(&jobs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list jobs"})
		return
	}

	c.JSON(http.StatusOK, jobs)
}

// DeleteScheduledJob removes a job
func (h *Handlers) DeleteScheduledJob(c *gin.Context) {
	jobID := c.Param("job_id")
	userID := c.GetUint("user_id")

	if err := h.db.Where("id = ? AND user_id = ?", jobID, userID).Delete(&ScheduledJob{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete job"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Job deleted"})
}

// ========== Webhooks (Phase 2) ==========

// CreateWebhook generates a trigger URL
func (h *Handlers) CreateWebhook(c *gin.Context) {
	moduleID := c.Param("id")
	userID := c.GetUint("user_id")

	var req struct {
		Slug  string                 `json:"slug" binding:"required"`
		Input map[string]interface{} `json:"input"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	webhook := ModuleWebhook{
		UserID:    userID,
		ModuleID:  moduleID,
		Slug:      req.Slug,
		Input:     req.Input,
		IsEnabled: true,
		CreatedAt: time.Now(),
	}

	if err := h.db.Create(&webhook).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create webhook (slug might be taken)"})
		return
	}

	c.JSON(http.StatusCreated, webhook)
}

// TriggerWebhook executes a module via slug
func (h *Handlers) TriggerWebhook(c *gin.Context) {
	slug := c.Param("slug")

	var webhook ModuleWebhook
	if err := h.db.Where("slug = ? AND is_enabled = ?", slug, true).First(&webhook).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Webhook not found"})
		return
	}

	// Execute Module
	req := &ExecutionRequest{
		UserID:        webhook.UserID,
		ModuleID:      webhook.ModuleID,
		ExecutionMode: ExecutionServer,
		Input:         webhook.Input,
	}

	// We permit public triggers for now, but in prod we might check IP wl/sig
	result, err := h.spawner.Execute(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// ========== Secrets (Phase 1.5) ==========

// SetSecret saves an encrypted secret
func (h *Handlers) SetSecret(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		Key   string `json:"key" binding:"required"`
		Value string `json:"value" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := h.registry.SetSecret(userID, req.Key, req.Value); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save secret"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Secret saved"})
}

// ListSecrets returns all secret keys (no values)
func (h *Handlers) ListSecrets(c *gin.Context) {
	userID := c.GetUint("user_id")

	keys, err := h.registry.ListSecrets(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list secrets"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"keys": keys})
}

// DeleteSecret removes a secret
func (h *Handlers) DeleteSecret(c *gin.Context) {
	key := c.Param("key")
	userID := c.GetUint("user_id")

	if err := h.registry.DeleteSecret(userID, key); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete secret"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Secret deleted"})
}
