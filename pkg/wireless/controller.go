package wireless

import (
	"fmt"
	"math/rand"
	"time"

	"networking-main/internal/models"

	"gorm.io/gorm"
)

// Controller manages the wireless network
type Controller struct {
	db *gorm.DB
}

// NewController creates a new WLC
func NewController(db *gorm.DB) *Controller {
	return &Controller{
		db: db,
	}
}

// ProvisionAP adds a new AP to management
func (c *Controller) ProvisionAP(name, mac, ip, model string) (*models.AccessPoint, error) {
	ap := &models.AccessPoint{
		Name:             name,
		MACAddress:       mac,
		IPAddress:        ip,
		Model:            model,
		Status:           "online",
		ConnectedClients: 0,
		LastSeen:         time.Now(),
	}

	if err := c.db.Create(ap).Error; err != nil {
		return nil, err
	}
	return ap, nil
}

// CreateSSID creates a new wireless profile
func (c *Controller) CreateSSID(name, ssid, security string, vlan int) (*models.SSIDProfile, error) {
	profile := &models.SSIDProfile{
		Name:     name,
		SSID:     ssid,
		Security: security,
		VLAN:     vlan,
	}

	if err := c.db.Create(profile).Error; err != nil {
		return nil, err
	}
	return profile, nil
}

// SimulateRoaming moves a client to a different AP
func (c *Controller) SimulateRoaming(clientMAC, targetAPMac string) error {
	// Find Client
	var client models.WirelessClient
	if err := c.db.Where("mac_address = ?", clientMAC).First(&client).Error; err != nil {
		// Create if not exists for simulation/demo purposes
		client = models.WirelessClient{
			MACAddress: clientMAC,
			IPAddress:  "192.168.10." + fmt.Sprint(rand.Intn(250)),
			SSID:       "Corp-WiFi",
			Signal:     -70,
			LastSeen:   time.Now(),
		}
		// If we create it, we need an initial AP. We'll set it to target later.
	}

	// Find Target AP
	var targetAP models.AccessPoint
	// Assuming targetAPMac is actually the ID or MAC. The original function used ID.
	// Let's assume input is MAC for realism, or ID if easier.
	// The original code passed `targetAPID`.
	// Let's support fuzzy finding or just look up by ID/MAC.
	// Wait, the signature says `targetAPID` in the old code, but I changed the param name to `targetAPMac` in signature above?
	// Let's stick to ID to be safe if generic. But strictly, roaming happens to BSSID (MAC).
	// Let's use ID finding for simplicity if provided as ID string? No, ID is uint now.
	// I'll assume the input is an ID converted to string or just MAC.
	// Let's try to parse as ID first.
	// Actually, let's just look up by MAC as that's realistic for `SimulateRoaming`.

	if err := c.db.Where("mac_address = ? OR id = ?", targetAPMac, targetAPMac).First(&targetAP).Error; err != nil {
		return fmt.Errorf("target AP not found")
	}

	// Update Client
	oldAPID := client.APID
	client.APID = targetAP.ID
	client.Signal = -50 + rand.Intn(20) // Better signal
	client.LastSeen = time.Now()

	if client.ID == 0 {
		if err := c.db.Create(&client).Error; err != nil {
			return err
		}
	} else {
		if err := c.db.Save(&client).Error; err != nil {
			return err
		}
	}

	// Update AP stats (simple counter update)
	// Decrement old
	if oldAPID != 0 {
		c.db.Model(&models.AccessPoint{}).Where("id = ?", oldAPID).UpdateColumn("connected_clients", gorm.Expr("connected_clients - ?", 1))
	}
	// Increment new
	c.db.Model(&models.AccessPoint{}).Where("id = ?", targetAP.ID).UpdateColumn("connected_clients", gorm.Expr("connected_clients + ?", 1))

	fmt.Printf("[WLC] Client %s roamed to AP %s\n", clientMAC, targetAP.Name)
	return nil
}

func (c *Controller) GetInventory() ([]models.AccessPoint, error) {
	var aps []models.AccessPoint
	err := c.db.Find(&aps).Error
	return aps, err
}
