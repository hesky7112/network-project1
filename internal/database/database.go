package database

import (
	"log"
	"os"
	"time"

	"fmt"
	"networking-main/internal/models"
	"networking-main/pkg/auth"
	"networking-main/pkg/collaboration"
	"networking-main/pkg/health"
	"networking-main/pkg/netconfig"
	"networking-main/pkg/netflow"
	"networking-main/pkg/onboarding"
	"networking-main/pkg/queue"
	"networking-main/pkg/staff"

	"github.com/glebarez/sqlite"
	"github.com/go-redis/redis/v8"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect() (*gorm.DB, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		user := os.Getenv("DB_USER")
		password := os.Getenv("DB_PASSWORD")
		dbname := os.Getenv("DB_NAME")
		host := os.Getenv("DB_HOST")
		port := os.Getenv("DB_PORT")
		dsn = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, dbname)
	}

	var dialector gorm.Dialector
	if len(dsn) > 9 && dsn[:9] == "sqlite://" {
		dbPath := dsn[9:]
		dialector = sqlite.Open(dbPath)
	} else {
		dialector = postgres.Open(dsn)
	}

	db, err := gorm.Open(dialector, &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Enable pgvector if available (only for Postgres)
	if dialector.Name() == "postgres" {
		db.Exec("CREATE EXTENSION IF NOT EXISTS vector")
	}

	log.Println("Database connected successfully")
	return db, nil
}

func InitializeRedis(redisURL string) *redis.Client {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatal("Failed to parse Redis URL:", err)
	}
	client := redis.NewClient(opt)
	log.Println("Redis connected successfully")
	return client
}

func SeedWiFiPackages(db *gorm.DB) {
	var count int64
	db.Model(&models.PricingPackage{}).Count(&count)
	if count == 0 {
		packages := []models.PricingPackage{
			// Hotspot
			{Name: "1 Hour Fast", Type: "hotspot", Price: 10, PriceLabel: "KES 10", Duration: 60, SortOrder: 1, Description: "Valid for 1 hour. Unlimited data."},
			{Name: "24 Hours Day Pass", Type: "hotspot", Price: 50, PriceLabel: "KES 50", Duration: 1440, SortOrder: 2, Description: "Valid for 24 hours. Unlimited data."},

			// ISP / Fibre
			{Name: "ISP / Fibre / Ethernet", Type: "isp", Price: 0, PriceLabel: "Custom", Duration: 43200, SortOrder: 10, Description: "Bulk bandwidth management for Fibre & Ethernet providers.", Features: "[\"PPPoE Radius Integration\", \"Advanced Bandwidth Throttling\", \"White-label Customer Portal\", \"Fibre Cut Detection\"]"},

			// WISP
			{Name: "WISP / Hotspot", Type: "hotspot", Price: 1000, PriceLabel: "Starter", Duration: 43200, SortOrder: 11, Description: "Wireless management with voucher and signal telemetry.", Features: "[\"Voucher Management System\", \"Multi-device Login Support\", \"Signal Strength Telemetry\"]"},

			// Enterprise
			{Name: "Enterprise / Business", Type: "enterprise", Price: 5000, PriceLabel: "Premium", Duration: 43200, SortOrder: 20, Description: "Mission-critical connectivity for large scale operations.", Features: "[\"Dedicated 1:1 Bandwidth\", \"Static IP Management\", \"Multi-branch VPN Tunneling\"]"},

			// Education
			{Name: "Education / Schools", Type: "education", Price: 3000, PriceLabel: "Pro", Duration: 43200, SortOrder: 30, Description: "Controlled and safe internet for educational institutions.", Features: "[\"Advanced Content Filtering\", \"Hourly Access Scheduling\", \"Classroom Lab Controls\"]"},

			// QoS Custom (Daily Boost)
			{Name: "Gaming Boost (6 hrs)", Type: "qos", Price: 100, PriceLabel: "KES 100", Duration: 360, SortOrder: 5, DownloadSpeed: 102400, UploadSpeed: 102400, Description: "Low latency, high speed boost for 6 hours"},
		}
		for _, pkg := range packages {
			db.Create(&pkg)
		}
	}
}

func SeedISPData(db *gorm.DB) {
	// Seed IP Pools
	var poolCount int64
	db.Model(&models.IPPool{}).Count(&poolCount)
	if poolCount == 0 {
		pools := []models.IPPool{
			{Name: "Hotspot Pool", Subnet: "10.10.0.0/16", Gateway: "10.10.0.1", StartIP: "10.10.0.10", EndIP: "10.10.255.254", Type: "dynamic"},
			{Name: "PPPoE Pool", Subnet: "10.20.0.0/16", Gateway: "10.20.0.1", StartIP: "10.20.0.10", EndIP: "10.20.255.254", Type: "pppoe"},
		}
		for _, pool := range pools {
			db.Create(&pool)
		}
	}

	// Seed Tax Config
	var taxCount int64
	db.Model(&models.TaxConfig{}).Count(&taxCount)
	if taxCount == 0 {
		taxes := []models.TaxConfig{
			{Name: "VAT", Rate: 16.0, IsActive: true},
			{Name: "Service Tax", Rate: 2.0, IsActive: true},
		}
		for _, tax := range taxes {
			db.Create(&tax)
		}
	}
}

// Migrate performs database migrations
func Migrate(db *gorm.DB) {
	err := db.AutoMigrate(
		// Core models
		&models.User{},
		&models.Device{},
		&models.ConfigBackup{},
		&models.TelemetryData{},
		&models.DiscoveryJob{},
		&models.NetworkAlert{},
		&models.NetworkLink{},
		// VLANInterface should be before VLAN since VLAN references VLANInterface
		&models.VLANInterface{},
		&models.VLAN{},

		// Advanced NetConfig models
		&models.STPConfig{},
		&models.EtherChannelConfig{},
		&models.FirmwareUpgrade{},
		&models.LoadBalancerConfig{},
		&models.CloudConnectionConfig{},
		&models.K8sClusterConfig{},
		&models.SDWANSite{},
		&models.SDWANOverlayConfig{},
		&models.AccessPoint{},
		&models.SSIDProfile{},
		&models.WirelessClient{},
		&models.SimulationScenario{},
		&models.VirtualNode{},
		&models.VirtualLink{},
		&models.VPNConfig{},
		&models.DNSRecordConfig{},

		// NetConfig management models
		&models.SystemSetting{},
		&netconfig.ChangeRequest{},
		&netconfig.ChangeApproval{},
		&netconfig.ChangeWindow{},

		// Hotspot & Payment models
		&models.PricingPackage{},
		&models.HotspotUser{},
		&models.Voucher{},
		&models.Payment{},
		&models.RadiusSession{},
		&models.Wallet{},
		&models.WalletTransaction{},

		// ISP Core models
		&models.IPPool{},
		&models.IPLease{},
		&models.Invoice{},
		&models.FUPConfig{},
		&models.TaxConfig{},
		&models.BoostSession{},
		&models.BotConfig{},

		// Advanced Architecture models
		&models.RemoteProbe{},
		&models.ProbeResult{},
		&models.WebhookConfig{},

		// RBAC models
		&auth.Role{},
		&auth.UserRole{},
		&auth.AuditLog{},

		// Staff tracking models
		&staff.StaffMember{},
		&staff.Attendance{},
		&staff.WorkLog{},
		&staff.LeaveRequest{},
		&staff.PerformanceMetric{},

		// Ticketing models
		&collaboration.Ticket{},
		&collaboration.TicketUpdate{},
		&collaboration.TechnicianDispatch{},

		// Chat models
		&collaboration.ChatMessage{},

		// Health analysis models
		&health.HealthAnalysis{},
		&health.HealthIssue{},
		&health.QuickFix{},

		// Onboarding models
		&onboarding.UserOnboarding{},
		&onboarding.InteractiveTour{},
		&onboarding.Tooltip{},

		// SSO models
		&auth.SSOSession{},

		// Job queue models
		&queue.Job{},

		// NetFlow models
		&netflow.FlowRecord{},
		&netflow.TrafficStats{},

		// Marketplace/Module models
		&models.Module{},
		&models.License{},
		&models.ExecutionLog{},
		&models.ModuleReview{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
	log.Println("Database migrated successfully")
}

func SeedAdminUser(db *gorm.DB) {
	var count int64
	email := "heskeyomondi@gmail.com"
	db.Model(&models.User{}).Where("email = ?", email).Count(&count)
	if count == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("omondiAlienNet7112"), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Failed to hash admin password: %v", err)
			return
		}

		admin := models.User{
			Username: "heskey",
			Email:    email,
			Password: string(hashedPassword),
			Role:     "admin",
		}
		if err := db.Create(&admin).Error; err != nil {
			log.Printf("Failed to seed admin user: %v", err)
		} else {
			log.Printf("✅ Admin user %s seeded successfully", email)
		}
	}

	// Ensure the link to Super Admin role exists
	var adminUser models.User
	if err := db.Where("email = ?", email).First(&adminUser).Error; err == nil {
		var superAdminRole auth.Role
		if err := db.Where("name = ?", "Super Admin").First(&superAdminRole).Error; err == nil {
			var existingLink auth.UserRole
			if err := db.Where("user_id = ? AND role_id = ?", adminUser.ID, superAdminRole.ID).First(&existingLink).Error; err == gorm.ErrRecordNotFound {
				userRole := auth.UserRole{
					UserID:     adminUser.ID,
					RoleID:     superAdminRole.ID,
					AssignedAt: time.Now(),
				}
				db.Create(&userRole)
				log.Printf("✅ Ensured %s is linked to Super Admin role", email)
			}
		}
	}
}
