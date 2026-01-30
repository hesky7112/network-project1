package sdwan

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net"
	"time"

	"networking-main/internal/models"

	"gorm.io/gorm"
)

// Service manages SD-WAN sites and overlays
type Service struct {
	db *gorm.DB
}

// NewService creates a new SD-WAN manager
func NewService(db *gorm.DB) *Service {
	return &Service{
		db: db,
	}
}

// RegisterSite provisions a new branch
func (s *Service) RegisterSite(name, location, lanSubnet string) (*models.SDWANSite, error) {
	// Validate subnet
	if _, _, err := net.ParseCIDR(lanSubnet); err != nil {
		return nil, fmt.Errorf("invalid subnet: %v", err)
	}

	site := &models.SDWANSite{
		SiteName:  name,
		Location:  location,
		LANSubnet: lanSubnet,
		Status:    "provisioned",
		LastSeen:  time.Now(),
	}

	if err := s.db.Create(site).Error; err != nil {
		return nil, err
	}

	return site, nil
}

// GenerateVPNConfig creates a secure overlay config for a site
func (s *Service) GenerateVPNConfig(siteID uint, vpnType string) (*models.SDWANOverlayConfig, error) {
	var site models.SDWANSite
	if err := s.db.First(&site, siteID).Error; err != nil {
		return nil, fmt.Errorf("site not found")
	}

	// Generate Keys
	pubKey, privKey := s.generateKeys()

	config := &models.SDWANOverlayConfig{
		SiteID:     site.ID,
		Type:       vpnType,
		PublicKey:  pubKey,
		PrivateKey: privKey,
		Endpoint:   "vpn.alien-network.com:51820",
		AllowedIPs: "10.0.0.0/8", // Access to corporate network
	}

	if vpnType == "ipsec" {
		config.Endpoint = "vpn.alien-network.com" // Standard IKEv2
		config.AllowedIPs = "0.0.0.0/0"           // Full tunnel example
	}

	if err := s.db.Create(config).Error; err != nil {
		return nil, err
	}

	fmt.Printf("[SD-WAN] Generated %s config for site %s\n", vpnType, site.SiteName)
	return config, nil
}

// HandleZTP handles Zero Touch Provisioning requests from devices
func (s *Service) HandleZTP(serialNumber string) (map[string]interface{}, error) {
	// Logic: Look up reliable inventory based on serial
	// For demo, we auto-approve if serial starts with "ALIEN-"
	if len(serialNumber) < 6 || serialNumber[:6] != "ALIEN-" {
		return nil, fmt.Errorf("device not authorized for ZTP")
	}

	// In a real implementation, we would register the device to a site here
	// or return a pending registration ID.

	return map[string]interface{}{
		"action":          "configure",
		"hostname":        "branch-router-" + serialNumber[6:],
		"config_url":      "https://api.alien-network.com/v1/configs/signed/123",
		"update_firmware": true,
	}, nil
}

// Helper to generate mock WireGuard-like keys
func (s *Service) generateKeys() (string, string) {
	b := make([]byte, 32)
	rand.Read(b)
	priv := base64.StdEncoding.EncodeToString(b)

	rand.Read(b)
	pub := base64.StdEncoding.EncodeToString(b)

	return pub, priv
}

func (s *Service) ListSites() ([]models.SDWANSite, error) {
	var sites []models.SDWANSite
	err := s.db.Find(&sites).Error
	return sites, err
}
