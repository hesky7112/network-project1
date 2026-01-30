package onboarding

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// OnboardingSystem manages user onboarding and tutorials
type OnboardingSystem struct {
	db *gorm.DB
}

// UserOnboarding tracks user onboarding progress
type UserOnboarding struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	UserID          uint      `json:"user_id" gorm:"uniqueIndex"`
	CurrentStep     int       `json:"current_step"`
	CompletedSteps  string    `json:"completed_steps" gorm:"type:jsonb"`
	SkippedSteps    string    `json:"skipped_steps" gorm:"type:jsonb"`
	StartedAt       time.Time `json:"started_at"`
	CompletedAt     *time.Time `json:"completed_at"`
	LastInteraction time.Time `json:"last_interaction"`
	Progress        float64   `json:"progress"` // 0-100
}

// OnboardingStep represents a single onboarding step
type OnboardingStep struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Type        string `json:"type"` // tour, tutorial, task, video
	Page        string `json:"page"` // Which page this step is on
	Target      string `json:"target"` // CSS selector for highlight
	Content     string `json:"content"`
	Action      string `json:"action"` // What user needs to do
	Optional    bool   `json:"optional"`
	Duration    int    `json:"duration"` // Estimated minutes
}

// InteractiveTour represents an interactive product tour
type InteractiveTour struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Steps       string    `json:"steps" gorm:"type:jsonb"`
	Category    string    `json:"category"` // beginner, intermediate, advanced
	Mandatory   bool      `json:"mandatory"`
	Order       int       `json:"order"`
}

// Tooltip represents contextual help tooltips
type Tooltip struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	Page     string `json:"page"`
	Element  string `json:"element"` // CSS selector
	Title    string `json:"title"`
	Content  string `json:"content"`
	Position string `json:"position"` // top, bottom, left, right
	Trigger  string `json:"trigger"` // hover, click, focus
}

// NewOnboardingSystem creates a new onboarding system
func NewOnboardingSystem(db *gorm.DB) *OnboardingSystem {
	os := &OnboardingSystem{db: db}
	os.initializeDefaultSteps()
	return os
}

// initializeDefaultSteps creates default onboarding steps
func (os *OnboardingSystem) initializeDefaultSteps() {
	tours := []InteractiveTour{
		{
			Name:        "Welcome to Network Automation",
			Description: "Learn the basics of the platform",
			Category:    "beginner",
			Mandatory:   true,
			Order:       1,
			Steps:       os.getWelcomeTourSteps(),
		},
		{
			Name:        "Device Discovery",
			Description: "Learn how to discover and manage network devices",
			Category:    "beginner",
			Mandatory:   false,
			Order:       2,
			Steps:       os.getDiscoveryTourSteps(),
		},
		{
			Name:        "Configuration Management",
			Description: "Master configuration backup and deployment",
			Category:    "intermediate",
			Mandatory:   false,
			Order:       3,
			Steps:       os.getConfigTourSteps(),
		},
		{
			Name:        "Health Monitoring",
			Description: "Monitor system health and apply quick fixes",
			Category:    "intermediate",
			Mandatory:   false,
			Order:       4,
			Steps:       os.getHealthTourSteps(),
		},
		{
			Name:        "Advanced Features",
			Description: "Explore GitOps, ZTP, and automation",
			Category:    "advanced",
			Mandatory:   false,
			Order:       5,
			Steps:       os.getAdvancedTourSteps(),
		},
	}

	for _, tour := range tours {
		var existing InteractiveTour
		result := os.db.Where("name = ?", tour.Name).First(&existing)
		if result.Error == gorm.ErrRecordNotFound {
			os.db.Create(&tour)
		}
	}
}

// StartOnboarding starts onboarding for a user
func (os *OnboardingSystem) StartOnboarding(userID uint) (*UserOnboarding, error) {
	onboarding := &UserOnboarding{
		UserID:          userID,
		CurrentStep:     1,
		CompletedSteps:  "[]",
		SkippedSteps:    "[]",
		StartedAt:       time.Now(),
		LastInteraction: time.Now(),
		Progress:        0,
	}

	if err := os.db.Create(onboarding).Error; err != nil {
		return nil, err
	}

	return onboarding, nil
}

// GetUserOnboarding retrieves user's onboarding status
func (os *OnboardingSystem) GetUserOnboarding(userID uint) (*UserOnboarding, error) {
	var onboarding UserOnboarding
	err := os.db.Where("user_id = ?", userID).First(&onboarding).Error
	if err == gorm.ErrRecordNotFound {
		return os.StartOnboarding(userID)
	}
	return &onboarding, err
}

// CompleteStep marks a step as completed
func (os *OnboardingSystem) CompleteStep(userID uint, stepID int) error {
	var onboarding UserOnboarding
	if err := os.db.Where("user_id = ?", userID).First(&onboarding).Error; err != nil {
		return err
	}

	var completed []int
	json.Unmarshal([]byte(onboarding.CompletedSteps), &completed)
	completed = append(completed, stepID)
	completedJSON, _ := json.Marshal(completed)

	onboarding.CompletedSteps = string(completedJSON)
	onboarding.CurrentStep = stepID + 1
	onboarding.LastInteraction = time.Now()
	onboarding.Progress = os.calculateProgress(completed)

	// Check if all mandatory steps completed
	if onboarding.Progress >= 100 && onboarding.CompletedAt == nil {
		now := time.Now()
		onboarding.CompletedAt = &now
	}

	return os.db.Save(&onboarding).Error
}

// SkipStep marks a step as skipped
func (os *OnboardingSystem) SkipStep(userID uint, stepID int) error {
	var onboarding UserOnboarding
	if err := os.db.Where("user_id = ?", userID).First(&onboarding).Error; err != nil {
		return err
	}

	var skipped []int
	json.Unmarshal([]byte(onboarding.SkippedSteps), &skipped)
	skipped = append(skipped, stepID)
	skippedJSON, _ := json.Marshal(skipped)

	onboarding.SkippedSteps = string(skippedJSON)
	onboarding.CurrentStep = stepID + 1
	onboarding.LastInteraction = time.Now()

	return os.db.Save(&onboarding).Error
}

// GetAllTours retrieves all interactive tours
func (os *OnboardingSystem) GetAllTours() ([]InteractiveTour, error) {
	var tours []InteractiveTour
	err := os.db.Order("order ASC").Find(&tours).Error
	return tours, err
}

// GetToursByCategory retrieves tours by category
func (os *OnboardingSystem) GetToursByCategory(category string) ([]InteractiveTour, error) {
	var tours []InteractiveTour
	err := os.db.Where("category = ?", category).Order("order ASC").Find(&tours).Error
	return tours, err
}

// GetTooltipsForPage retrieves tooltips for a specific page
func (os *OnboardingSystem) GetTooltipsForPage(page string) ([]Tooltip, error) {
	var tooltips []Tooltip
	err := os.db.Where("page = ?", page).Find(&tooltips).Error
	return tooltips, err
}

// calculateProgress calculates onboarding progress percentage
func (os *OnboardingSystem) calculateProgress(completedSteps []int) float64 {
	// Get total mandatory steps
	var totalMandatory int64
	os.db.Model(&InteractiveTour{}).Where("mandatory = ?", true).Count(&totalMandatory)

	if totalMandatory == 0 {
		return 100
	}

	return (float64(len(completedSteps)) / float64(totalMandatory)) * 100
}

// Helper functions to generate tour steps

func (os *OnboardingSystem) getWelcomeTourSteps() string {
	steps := []OnboardingStep{
		{
			ID:          1,
			Title:       "Welcome to Network Automation Platform",
			Description: "Let's take a quick tour of the main features",
			Type:        "tour",
			Page:        "/dashboard",
			Content:     "This platform helps you automate network management, monitoring, and configuration tasks.",
			Duration:    1,
		},
		{
			ID:          2,
			Title:       "Dashboard Overview",
			Description: "Your central hub for network insights",
			Type:        "tour",
			Page:        "/dashboard",
			Target:      ".dashboard-stats",
			Content:     "The dashboard shows real-time statistics about your network devices, alerts, and system health.",
			Duration:    2,
		},
		{
			ID:          3,
			Title:       "Navigation Menu",
			Description: "Access all features from the sidebar",
			Type:        "tour",
			Page:        "/dashboard",
			Target:      ".sidebar-nav",
			Content:     "Use the navigation menu to access Discovery, Configuration, Monitoring, Health, and more.",
			Duration:    1,
		},
	}

	stepsJSON, _ := json.Marshal(steps)
	return string(stepsJSON)
}

func (os *OnboardingSystem) getDiscoveryTourSteps() string {
	steps := []OnboardingStep{
		{
			ID:          4,
			Title:       "Device Discovery",
			Description: "Find and add network devices",
			Type:        "tutorial",
			Page:        "/discovery",
			Content:     "Discovery helps you automatically find devices on your network using SNMP, SSH, or API.",
			Action:      "Click 'Start Discovery' to begin",
			Duration:    5,
		},
		{
			ID:          5,
			Title:       "Network Topology",
			Description: "Visualize your network",
			Type:        "tutorial",
			Page:        "/discovery",
			Target:      ".topology-view",
			Content:     "The topology view shows how your devices are connected. Click on devices to see details.",
			Duration:    3,
		},
	}

	stepsJSON, _ := json.Marshal(steps)
	return string(stepsJSON)
}

func (os *OnboardingSystem) getConfigTourSteps() string {
	steps := []OnboardingStep{
		{
			ID:          6,
			Title:       "Configuration Backups",
			Description: "Protect your device configurations",
			Type:        "tutorial",
			Page:        "/config",
			Content:     "Automatically backup device configurations and restore them when needed.",
			Action:      "Create your first backup",
			Duration:    5,
		},
		{
			ID:          7,
			Title:       "Configuration Templates",
			Description: "Deploy consistent configurations",
			Type:        "tutorial",
			Page:        "/config",
			Content:     "Use templates to deploy standardized configurations across multiple devices.",
			Duration:    5,
		},
	}

	stepsJSON, _ := json.Marshal(steps)
	return string(stepsJSON)
}

func (os *OnboardingSystem) getHealthTourSteps() string {
	steps := []OnboardingStep{
		{
			ID:          8,
			Title:       "System Health Monitoring",
			Description: "Keep your network healthy",
			Type:        "tutorial",
			Page:        "/health",
			Content:     "Monitor system, network, and security health in real-time.",
			Duration:    5,
		},
		{
			ID:          9,
			Title:       "Quick Fixes",
			Description: "Resolve issues automatically",
			Type:        "tutorial",
			Page:        "/health",
			Target:      ".quick-fixes-panel",
			Content:     "When issues are detected, apply automated quick fixes with one click.",
			Action:      "Try applying a quick fix",
			Duration:    3,
		},
	}

	stepsJSON, _ := json.Marshal(steps)
	return string(stepsJSON)
}

func (os *OnboardingSystem) getAdvancedTourSteps() string {
	steps := []OnboardingStep{
		{
			ID:          10,
			Title:       "GitOps Integration",
			Description: "Version control for configurations",
			Type:        "tutorial",
			Page:        "/config",
			Content:     "Track all configuration changes in Git with full history and rollback capabilities.",
			Optional:    true,
			Duration:    10,
		},
		{
			ID:          11,
			Title:       "Zero Touch Provisioning",
			Description: "Automate device onboarding",
			Type:        "tutorial",
			Page:        "/ztp",
			Content:     "Automatically provision new devices without manual configuration.",
			Optional:    true,
			Duration:    10,
		},
	}

	stepsJSON, _ := json.Marshal(steps)
	return string(stepsJSON)
}

// GetNextStep gets the next recommended step for a user
func (os *OnboardingSystem) GetNextStep(userID uint) (*OnboardingStep, error) {
	onboarding, err := os.GetUserOnboarding(userID)
	if err != nil {
		return nil, err
	}

	// Get all tours
	tours, err := os.GetAllTours()
	if err != nil {
		return nil, err
	}

	// Find the next incomplete mandatory tour
	var completed []int
	json.Unmarshal([]byte(onboarding.CompletedSteps), &completed)

	for _, tour := range tours {
		if tour.Mandatory {
			var steps []OnboardingStep
			json.Unmarshal([]byte(tour.Steps), &steps)

			for _, step := range steps {
				if !contains(completed, step.ID) {
					return &step, nil
				}
			}
		}
	}

	return nil, nil
}

// Helper function
func contains(slice []int, item int) bool {
	for _, v := range slice {
		if v == item {
			return true
		}
	}
	return false
}
