package database

import (
	"os"

	"gorm.io/gorm"
)

// Initialize sets up the database connection and runs migrations
func Initialize(databaseURL string) (*gorm.DB, error) {
	// Set environment variables from the database URL
	// Format: postgres://user:password@host:port/dbname?sslmode=disable
	db, err := Connect()
	if err != nil {
		return nil, err
	}

	// Run migrations
	Migrate(db)

	// Seed default data
	SeedWiFiPackages(db)
	SeedISPData(db)
	SeedAdminUser(db)

	// Initialize Redis if needed
	if redisURL := os.Getenv("REDIS_URL"); redisURL != "" {
		InitializeRedis(redisURL)
	}

	return db, nil
}
