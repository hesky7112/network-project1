package provisioning

import (
	"context"
	"fmt"
	"log"
	"networking-main/internal/models"
	"time"

	"gorm.io/gorm"
)

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

// SyncUserToRouter pushes user configuration to a specific NAS (Network Access Server)
func (s *Service) SyncUserToRouter(ctx context.Context, userID uint, deviceID uint) error {
	var user models.HotspotUser
	if err := s.db.WithContext(ctx).First(&user, userID).Error; err != nil {
		return err
	}

	var device models.Device
	if err := s.db.WithContext(ctx).First(&device, deviceID).Error; err != nil {
		return err
	}

	// For simulation, we assume device uses MikroTik
	client := &MikroTikClient{
		Addr:     fmt.Sprintf("%s:8728", device.IPAddress),
		Username: "admin", // Should be fetched from secrets manager/vault
		Password: "password",
	}

	if user.ServiceType == "pppoe" {
		// Pushing PPPoE Secret
		return client.AddPPPoESecret(user.Username, user.Password, "default-pppoe", user.IPAddress)
	} else {
		// Pushing Hotspot User
		return client.AddHotspotUser(user.Username, "1234", "default-hotspot", user.MACAddress)
	}
}

// ProvisionQoS sets up a simple queue for a user's bandwidth
func (s *Service) ProvisionQoS(ctx context.Context, userID uint, deviceID uint, down, up int) error {
	var user models.HotspotUser
	if err := s.db.WithContext(ctx).First(&user, userID).Error; err != nil {
		return err
	}

	var device models.Device
	if err := s.db.WithContext(ctx).First(&device, deviceID).Error; err != nil {
		return err
	}

	client := &MikroTikClient{
		Addr:     fmt.Sprintf("%s:8728", device.IPAddress),
		Username: "admin",
		Password: "password",
	}

	limitStr := fmt.Sprintf("%dk/%dk", up, down)
	return client.SetQueue(fmt.Sprintf("Q-%s", user.Username), user.IPAddress, limitStr, limitStr)
}

// ScheduleBoost initiates a temporary speed upgrade
func (s *Service) ScheduleBoost(ctx context.Context, userID uint, deviceID uint, packageID uint, duration time.Duration) error {
	var pkg models.PricingPackage
	if err := s.db.WithContext(ctx).First(&pkg, packageID).Error; err != nil {
		return err
	}

	// 1. Record the boost session
	session := &models.BoostSession{
		UserID:    userID,
		PackageID: packageID,
		Status:    "active",
		ExpiresAt: time.Now().Add(duration),
	}
	if err := s.db.WithContext(ctx).Create(session).Error; err != nil {
		return err
	}

	// 2. Apply QoS on the router
	return s.ProvisionQoS(ctx, userID, deviceID, pkg.DownloadSpeed, pkg.UploadSpeed)
}

// StartBoostWorker runs a background routine to clean up expired boost sessions
func (s *Service) StartBoostWorker(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute)
	go func() {
		for {
			select {
			case <-ticker.C:
				s.expireBoosts(ctx)
			case <-ctx.Done():
				ticker.Stop()
				return
			}
		}
	}()
}

func (s *Service) expireBoosts(ctx context.Context) {
	var expired []models.BoostSession
	now := time.Now()

	s.db.WithContext(ctx).Where("status = ? AND expires_at < ?", "active", now).Find(&expired)

	for _, session := range expired {
		s.db.Model(&session).Update("status", "expired")
		log.Printf("👽 Boost session %d for user %d expired", session.ID, session.UserID)
	}
}

// SetL7Priority applies L7 traffic marking for a user
func (s *Service) SetL7Priority(ctx context.Context, userID uint, deviceID uint, category string) error {
	var user models.HotspotUser
	if err := s.db.WithContext(ctx).First(&user, userID).Error; err != nil {
		return err
	}

	var device models.Device
	if err := s.db.WithContext(ctx).First(&device, deviceID).Error; err != nil {
		return err
	}

	client := &MikroTikClient{
		Addr:     fmt.Sprintf("%s:8728", device.IPAddress),
		Username: "admin",
		Password: "password",
	}

	return client.MarkTraffic(user.IPAddress, category)
}
