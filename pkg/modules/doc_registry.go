package modules

import (
	"gorm.io/gorm"
)

// One-stop shop for documentation

func (r *Registry) ListDocCategories() ([]DocCategory, error) {
	var cats []DocCategory
	err := r.DB.Preload("Pages", func(db *gorm.DB) *gorm.DB {
		return db.Order("`order` ASC") // Quote order because it's a keyword in SQL
	}).Order("`order` ASC").Find(&cats).Error
	return cats, err
}

func (r *Registry) GetDocPage(id string) (*DocPage, error) {
	var page DocPage
	err := r.DB.First(&page, "id = ?", id).Error
	return &page, err
}

// SeedDocs populates the DB if empty
func (r *Registry) SeedDocs() {
	var count int64
	if err := r.DB.Model(&DocCategory{}).Count(&count).Error; err != nil {
		return
	}
	if count > 0 {
		return // Already seeded
	}

	// 1. Getting Started
	catInit := DocCategory{ID: "initialization", Title: "Getting Started", Order: 1}
	r.DB.Create(&catInit)

	r.DB.Create(&DocPage{
		ID: "quick-start", CategoryID: "initialization", Title: "Quick Start", Order: 1, Icon: "Zap",
		Content: `# Quick Start
Get up and running quickly. Our lightweight agent connects your team immediately.

**Installation**:
` + "```bash" + `
# Install the app
curl -sSL https://get.aliennet.io | sh
# Connecting...
` + "```" + `
`,
	})

	r.DB.Create(&DocPage{
		ID: "how-it-works", CategoryID: "initialization", Title: "How It Works", Order: 2, Icon: "Cpu",
		Content: `# How It Works

## The Problem
Old networking tools are slow and complicated. We built this to make managing your connections instant and easy, no matter where you are.

## The Solution
Our system works like a team chat. Every device talks to each other instantly, keeping everyone in sync without delay.
`,
	})

	// 2. Core Features
	catCore := DocCategory{ID: "core", Title: "Core Features", Order: 2}
	r.DB.Create(&catCore)

	r.DB.Create(&DocPage{
		ID: "network-map", CategoryID: "core", Title: "Network Map", Order: 1, Icon: "GitBranch",
		Content: `# Network Map
See your entire project layout clearly. We automatically find the best path for your data to travel.

### Avoiding Traffic Jams
Standard tools can get stuck when lines are busy. We use smart routing to use every available connection so your work never stops.
`,
	})

	r.DB.Create(&DocPage{
		ID: "secure-access", CategoryID: "core", Title: "Secure Access", Order: 2, Icon: "Terminal",
		Content: `# Secure Access
Manage access easily. We handle thousands of connections without slowing down.

**Smart Connections**: We keep connections open efficiently to save time.
**Safe Login**: Your access keys are protected by top-tier security standards.
`,
	})

	r.DB.Create(&DocPage{
		ID: "monitoring", CategoryID: "core", Title: "Traffic Monitoring", Order: 3, Icon: "Activity",
		Content: `# Traffic Monitoring
See what's happening on your network in real-time.

**Fast Processing**: We analyze data instantly so you never miss a beat.
`,
	})

	// 3. Smart Features
	catIntel := DocCategory{ID: "intelligence", Title: "Smart Features", Order: 3}
	r.DB.Create(&catIntel)

	r.DB.Create(&DocPage{
		ID: "ai-help", CategoryID: "intelligence", Title: "AI Help", Order: 1, Icon: "Code",
		Content: `# AI Help
Our AI doesn't just alert you to problems; it helps you prevent them. It learns what is normal for your system and spots issues before they happen.

**Capabilities**:
- Spot Unusual Activity
- Predict User Churn
- Balance Workload
`,
	})

	r.DB.Create(&DocPage{
		ID: "security", CategoryID: "intelligence", Title: "Security", Order: 2, Icon: "Shield",
		Content: `# Security
Safety is built-in, not an add-on. We use banking-grade encryption to keep everything safe.

### Key Management
Managing passwords manually is risky. Our **Vault** automatically changes keys every hour to keep hackers out.
`,
	})

	r.DB.Create(&DocPage{
		ID: "global", CategoryID: "intelligence", Title: "Global Reach", Order: 3, Icon: "Globe",
		Content: `# Global Reach
Works reliably everywhere. We map physical locations to network speed to ensure the best performance.

**Sync Engine**: If one region goes down, we automatically route around it to keep you online.
`,
	})
}
