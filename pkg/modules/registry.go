package modules

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// Registry manages module metadata and discovery
type Registry struct {
	DB *gorm.DB
}

// NewRegistry creates a new module registry
func NewRegistry(db *gorm.DB) *Registry {
	r := &Registry{DB: db}

	// Seed documentation if needed
	go r.SeedDocs()
	go r.SeedCommunityData()

	return r
}

func (r *Registry) SeedCommunityData() {
	var count int64
	r.DB.Model(&ForumThread{}).Count(&count)
	if count == 0 {
		threads := []ForumThread{
			{
				Title:    "Optimizing Core Network Latency",
				Content:  "We're seeing sub-ms spikes during peak hours in the Nairobi data center. Any suggestions on buffer tuning for Alien Core switches?",
				Category: CategorySolutions,
				Upvotes:  24,
				Views:    156,
				AuthorID: 1,
				Tags:     []string{"latency", "nairobi", "switching"},
			},
			{
				Title:    "Community Showcase: Zero Trust Implementation",
				Content:  "Just finished a rollout for a 500-node hospital using the new SD-WAN module. AMA!",
				Category: CategoryShowcase,
				Upvotes:  42,
				Views:    312,
				AuthorID: 1,
				Tags:     []string{"sdwan", "security", "hospital"},
			},
			{
				Title:    "Challenge: High-Density WiFi for Stadiums",
				Content:  "Trying to handle 10k concurrent users on 5GHz. AP density is becoming an interference issue.",
				Category: CategoryChallenges,
				Upvotes:  18,
				Views:    89,
				AuthorID: 1,
				Tags:     []string{"wifi", "capacity", "rf"},
			},
		}
		for _, t := range threads {
			r.CreateThread(&t)
		}
	}
}

// Migrate creates the module tables
func (r *Registry) Migrate() error {
	return r.DB.AutoMigrate(
		&Module{},
		&License{},
		&ExecutionLog{},
		&ExecutionLog{},
		&ModuleReview{},
		&ModuleStorage{},
		&ModuleStorage{},
		&ScheduledJob{},
		&ModuleWebhook{},
		&UserSecret{},
		&ForumThread{},
		&ForumPost{},
		&UserReputation{},
		&DocCategory{},
		&DocPage{},
	)
}

// --- Module CRUD ---

// CreateModule registers a new module
func (r *Registry) CreateModule(m *Module) error {
	return r.DB.Create(m).Error
}

// GetModule retrieves a module by ID
func (r *Registry) GetModule(id string) (*Module, error) {
	var module Module
	if err := r.DB.First(&module, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &module, nil
}

// UpdateModule updates module metadata
func (r *Registry) UpdateModule(m *Module) error {
	return r.DB.Save(m).Error
}

// DeleteModule removes a module (soft delete recommended)
func (r *Registry) DeleteModule(id string) error {
	return r.DB.Delete(&Module{}, "id = ?", id).Error
}

// ListModules returns all modules with optional filtering
func (r *Registry) ListModules(category ModuleCategory, publishedOnly bool, limit, offset int) ([]Module, int64, error) {
	var modules []Module
	var total int64

	query := r.DB.Model(&Module{})

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if publishedOnly {
		query = query.Where("is_published = ?", true)
	}

	query.Count(&total)

	if err := query.Limit(limit).Offset(offset).Order("downloads DESC").Find(&modules).Error; err != nil {
		return nil, 0, err
	}

	return modules, total, nil
}

// SearchModules performs text search across modules
func (r *Registry) SearchModules(q string, publishedOnly bool, limit int) ([]Module, error) {
	var modules []Module
	pattern := "%" + q + "%"

	query := r.DB.Where("name ILIKE ? OR description ILIKE ?", pattern, pattern)
	if publishedOnly {
		query = query.Where("is_published = ?", true)
	}

	err := query.Limit(limit).Find(&modules).Error
	return modules, err
}

// GetUserModules returns modules created by a specific user
func (r *Registry) GetUserModules(author string) ([]Module, error) {
	var modules []Module
	err := r.DB.Where("author = ?", author).Order("updated_at DESC").Find(&modules).Error
	return modules, err
}

// PublishModule marks a module as public in the marketplace
func (r *Registry) PublishModule(id string, published bool) error {
	return r.DB.Model(&Module{}).Where("id = ?", id).Update("is_published", published).Error
}

// GetModulesByAura returns modules compatible with an aura
func (r *Registry) GetModulesByAura(auraType string) ([]Module, error) {
	var modules []Module

	// JSON contains check for PostgreSQL
	err := r.DB.Where(
		"aura_types @> ?",
		fmt.Sprintf(`["%s"]`, auraType),
	).Find(&modules).Error

	return modules, err
}

// IncrementDownloads bumps the download counter
func (r *Registry) IncrementDownloads(moduleID string) error {
	return r.DB.Model(&Module{}).
		Where("id = ?", moduleID).
		UpdateColumn("downloads", gorm.Expr("downloads + 1")).Error
}

// UpdateRating recalculates module rating from reviews
func (r *Registry) UpdateRating(moduleID string) error {
	var avgRating float64

	r.DB.Model(&ModuleReview{}).
		Where("module_id = ?", moduleID).
		Select("COALESCE(AVG(rating), 0)").
		Scan(&avgRating)

	return r.DB.Model(&Module{}).
		Where("id = ?", moduleID).
		Update("rating", avgRating).Error
}

// --- Reviews ---

// AddReview creates a new review
func (r *Registry) AddReview(review *ModuleReview) error {
	if err := r.DB.Create(review).Error; err != nil {
		return err
	}
	return r.UpdateRating(review.ModuleID)
}

// GetReviews returns reviews for a module
func (r *Registry) GetReviews(moduleID string, limit int) ([]ModuleReview, error) {
	var reviews []ModuleReview
	err := r.DB.Where("module_id = ?", moduleID).
		Order("created_at DESC").
		Limit(limit).
		Find(&reviews).Error
	return reviews, err
}

// --- Seeding ---

// SeedDefaultModules populates the registry with initial modules
func (r *Registry) SeedDefaultModules() error {
	modules := []Module{
		{
			ID:            "church-archive-digitizer",
			Name:          "Church Archive Digitizer",
			Description:   "Convert handwritten ledgers into searchable digital archives using AI-powered OCR.",
			Category:      CategoryChurch,
			Price:         299,
			LicenseType:   LicensePurchase,
			ExecutionMode: ExecutionHybrid,
			Primitives: []PrimitiveRef{
				{Module: "DocumentIntelligence", Method: "extract_text", Config: map[string]interface{}{"ocr_size": "gundam"}},
				{Module: "ReportGeneration", Method: "generate_pdf", Config: map[string]interface{}{"template": "church_ledger"}},
			},
			UITemplate: "modules/church_archive.marimo",
			UISchema: map[string]interface{}{
				"form_fields": []map[string]interface{}{
					{"name": "church_name", "type": "text", "label": "Church Name", "required": true},
					{"name": "ledger_file", "type": "file", "label": "Scan Ledger (PDF/JPG)", "required": true},
				},
				"output_type": "dashboard",
			},
			Author:    "AlienNet",
			Tags:      []string{"ocr", "pdf", "church", "archive"},
			AuraTypes: []string{"church"},
		},
		{
			ID:            "kra-itax-autofiler",
			Name:          "KRA iTax Auto-Filer",
			Description:   "Automatically populate and submit VAT, PAYE, and income tax returns to KRA.",
			Category:      CategoryCompliance,
			Price:         79,
			LicenseType:   LicenseLease,
			ExecutionMode: ExecutionServer,
			Primitives: []PrimitiveRef{
				{Module: "DataIngestion", Method: "fetch_kra_data", Config: nil},
				{Module: "ComplianceEngine", Method: "validate_kra_compliance", Config: nil},
				{Module: "ReportGeneration", Method: "generate_pdf", Config: map[string]interface{}{"template": "tax_return"}},
			},
			UITemplate: "modules/kra_itax.marimo",
			UISchema: map[string]interface{}{
				"form_fields": []map[string]interface{}{
					{"name": "pin", "type": "text", "label": "KRA PIN", "required": true},
					{"name": "period", "type": "text", "label": "Tax Period (MM/YYYY)", "required": true},
					{"name": "return_type", "type": "select", "label": "Return Type", "options": []string{"VAT", "PAYE", "Income Tax"}},
				},
				"output_type": "dashboard",
			},
			Author:    "AlienNet",
			Tags:      []string{"tax", "kra", "compliance", "kenya"},
			AuraTypes: []string{"business", "church", "school"},
		},
		{
			ID:            "event-ticketing",
			Name:          "Event Ticketing System",
			Description:   "Generate QR/NFC tickets, manage check-ins, and track attendance for events.",
			Category:      CategoryEvents,
			Price:         59,
			LicenseType:   LicenseLease,
			ExecutionMode: ExecutionHybrid,
			Primitives: []PrimitiveRef{
				{Module: "ReportGeneration", Method: "generate_qr_code", Config: nil},
				{Module: "HALInterface", Method: "scan_nfc", Config: nil},
				{Module: "PaymentProcessing", Method: "initiate_mpesa_stk", Config: nil},
			},
			UITemplate: "modules/event_ticketing.marimo",
			UISchema: map[string]interface{}{
				"form_fields": []map[string]interface{}{
					{"name": "event_name", "type": "text", "label": "Event Name", "required": true},
					{"name": "ticket_price", "type": "number", "label": "Ticket Price (KES)", "required": true},
					{"name": "max_tickets", "type": "number", "label": "Max Attendees", "default": 100},
				},
				"output_type": "download",
			},
			Author:      "AlienNet",
			Tags:        []string{"events", "tickets", "qr", "nfc"},
			RequiresHAL: true,
			AuraTypes:   []string{"church", "school", "business"},
		},
		{
			ID:            "medical-image-analyzer",
			Name:          "Medical Image Analyzer",
			Description:   "AI-powered analysis of X-rays, CT scans, and MRIs using MONAI.",
			Category:      CategoryHealthcare,
			Price:         199,
			LicenseType:   LicenseLease,
			ExecutionMode: ExecutionServer,
			Primitives: []PrimitiveRef{
				{Module: "MLEngine", Method: "analyze_medical_image", Config: map[string]interface{}{"model": "monai_unet"}},
				{Module: "ReportGeneration", Method: "generate_pdf", Config: map[string]interface{}{"template": "medical_report"}},
			},
			UITemplate: "modules/medical_imaging.marimo",
			UISchema: map[string]interface{}{
				"form_fields": []map[string]interface{}{
					{"name": "scan_file", "type": "file", "label": "Upload DICOM/X-ray", "required": true},
					{"name": "patient_id", "type": "text", "label": "Patient Reference"},
				},
				"output_type": "dashboard",
			},
			Author:      "AlienNet",
			Tags:        []string{"medical", "ai", "monai", "radiology"},
			RequiresGPU: true,
			AuraTypes:   []string{"hospital"},
		},
		{
			ID:            "network-troubleshooter-bot",
			Name:          "Network Troubleshooting Bot",
			Description:   "AI chatbot that diagnoses network issues and suggests fixes.",
			Category:      CategoryNetwork,
			Price:         54,
			LicenseType:   LicenseLease,
			ExecutionMode: ExecutionServer,
			Primitives: []PrimitiveRef{
				{Module: "ChatbotEngine", Method: "chat", Config: map[string]interface{}{"kb_id": "network_knowledge"}},
				{Module: "DataIngestion", Method: "fetch_internal_api", Config: map[string]interface{}{"endpoint": "/api/v1/telemetry/live"}},
			},
			UITemplate: "modules/network_bot.marimo",
			UISchema: map[string]interface{}{
				"form_fields": []map[string]interface{}{
					{"name": "query", "type": "text", "label": "What is the network issue?", "required": true},
				},
				"output_type": "chat",
			},
			Author:    "AlienNet",
			Tags:      []string{"network", "chatbot", "troubleshooting", "ai"},
			AuraTypes: []string{"default", "business", "school"},
		},
	}

	for _, m := range modules {
		if err := r.DB.FirstOrCreate(&m, "id = ?", m.ID).Error; err != nil {
			return err
		}
	}

	return nil
}

// ValidateModule checks if a module definition is valid
func (r *Registry) ValidateModule(m *Module) error {
	if m.ID == "" {
		return errors.New("module ID is required")
	}
	if m.Name == "" {
		return errors.New("module name is required")
	}
	if len(m.Primitives) == 0 {
		return errors.New("at least one primitive is required")
	}
	return nil
}

// --- Storage (Phase 1) ---

// SetStorage saves a key-value pair for a user/module
func (r *Registry) SetStorage(userID uint, moduleID, key, value string, isPublic bool) error {
	var storage ModuleStorage
	err := r.DB.Where("user_id = ? AND module_id = ? AND key = ?", userID, moduleID, key).First(&storage).Error

	if err == nil {
		// Update existing
		storage.Value = value
		storage.IsPublic = isPublic
		storage.UpdatedAt = time.Now()
		return r.DB.Save(&storage).Error
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Create new
		newStorage := ModuleStorage{
			UserID:    userID,
			ModuleID:  moduleID,
			Key:       key,
			Value:     value,
			IsPublic:  isPublic,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		return r.DB.Create(&newStorage).Error
	}

	return err
}

// GetStorage retrieves a value by key
func (r *Registry) GetStorage(userID uint, moduleID, key string) (*ModuleStorage, error) {
	var storage ModuleStorage
	err := r.DB.Where("user_id = ? AND module_id = ? AND key = ?", userID, moduleID, key).First(&storage).Error
	if err != nil {
		return nil, err
	}
	return &storage, nil
}

// ListStorage returns all keys for a user/module
func (r *Registry) ListStorage(userID uint, moduleID string) ([]ModuleStorage, error) {
	var items []ModuleStorage
	err := r.DB.Where("user_id = ? AND module_id = ?", userID, moduleID).Find(&items).Error
	return items, err
}

// DeleteStorage removes a key
func (r *Registry) DeleteStorage(userID uint, moduleID, key string) error {
	return r.DB.Where("user_id = ? AND module_id = ? AND key = ?", userID, moduleID, key).Delete(&ModuleStorage{}).Error
}

// --- Secrets (Phase 1.5) ---

// SetSecret saves an API key for a user
func (r *Registry) SetSecret(userID uint, key, value string) error {
	var secret UserSecret
	err := r.DB.Where("user_id = ? AND key = ?", userID, key).First(&secret).Error

	if err == nil {
		secret.Value = value // In prod: Encrypt(value)
		secret.UpdatedAt = time.Now()
		return r.DB.Save(&secret).Error
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		newSecret := UserSecret{
			UserID:    userID,
			Key:       key,
			Value:     value, // In prod: Encrypt(value)
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		return r.DB.Create(&newSecret).Error
	}

	return err
}

// GetSecret retrieves a secret value
func (r *Registry) GetSecret(userID uint, key string) (string, error) {
	var secret UserSecret
	err := r.DB.Where("user_id = ? AND key = ?", userID, key).First(&secret).Error
	if err != nil {
		return "", err
	}
	return secret.Value, nil // In prod: Decrypt(secret.Value)
}

// ListSecrets returns keys for a user (not values)
func (r *Registry) ListSecrets(userID uint) ([]string, error) {
	var secrets []UserSecret
	if err := r.DB.Where("user_id = ?", userID).Find(&secrets).Error; err != nil {
		return nil, err
	}

	keys := make([]string, len(secrets))
	for i, s := range secrets {
		keys[i] = s.Key
	}
	return keys, nil
}

// DeleteSecret removes a secret
func (r *Registry) DeleteSecret(userID uint, key string) error {
	return r.DB.Where("user_id = ? AND key = ?", userID, key).Delete(&UserSecret{}).Error
}
