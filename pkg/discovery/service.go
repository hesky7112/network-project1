package discovery

import (
	"encoding/json"
	"networking-main/internal/models"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Service struct {
	db                     *gorm.DB
	networkDiscoveryEngine *NetworkDiscoveryEngine
	enhancedTopologyEngine *EnhancedTopologyEngine
	completeVLANManager    *CompleteVLANManager
	firewallManager        *FirewallManager
	wirelessManager        *WirelessManager
	cableMapManager        *CableMapManager
	vlanVisualizer         *VLANVisualizer
}

type Config struct {
	// Network discovery configuration
	TargetNetworks []string
	Ports          []int
	Timeout        time.Duration
	Workers        int
	EnableSNMP     bool
	SNMPCommunity  string
}

func NewService(db *gorm.DB, cfg *Config) *Service {
	engine := NewNetworkDiscoveryEngine(db)
	return &Service{
		db:                     db,
		networkDiscoveryEngine: engine,
		enhancedTopologyEngine: &EnhancedTopologyEngine{db: db},
		completeVLANManager:    &CompleteVLANManager{db: db},
		firewallManager:        &FirewallManager{db: db},
		wirelessManager:        &WirelessManager{db: db},
		cableMapManager:        NewCableMapManager(db),
		vlanVisualizer:         NewVLANVisualizer(db),
	}
}

func (s *Service) StartDiscovery(c *gin.Context) error {
	// Default configuration
	config := ScanConfig{
		TargetNetworks: []string{"192.168.1.0/24", "10.0.0.0/24"},
		Ports:          []int{22, 23, 80, 443, 161, 3389},
		Timeout:        2 * time.Second,
		Workers:        10,
		EnableSNMP:     true,
		SNMPCommunity:  "public",
	}

	_, err := s.networkDiscoveryEngine.StartNetworkDiscovery(c, config)
	return err
}

func (s *Service) GetJobStatus(c *gin.Context, jobID string) (models.DiscoveryJob, error) {
	var job models.DiscoveryJob
	err := s.db.Where("id = ?", jobID).First(&job).Error
	return job, err
}

// Advanced discovery methods
func (s *Service) DiscoverTopology(c *gin.Context) error {
	// Get all devices
	var devices []models.Device
	err := s.db.Find(&devices).Error
	if err != nil {
		return err
	}

	// Discover topology for each device
	for _, device := range devices {
		// Discover CDP neighbors
		if device.DeviceType == "Cisco Router/Switch" || device.DeviceType == "cisco" {
			neighbors, err := s.enhancedTopologyEngine.CompleteCDPDiscovery(device)
			if err == nil {
				// Save topology links
				s.saveTopologyLinks(device.ID, neighbors)
			}
		}

		// Discover LLDP neighbors
		lldpNeighbors, err := s.enhancedTopologyEngine.CompleteLLDPDiscovery(device)
		if err == nil {
			// Save topology links
			s.saveLLDPNeighbors(device.ID, lldpNeighbors)
		}

		// Discover VLANs
		vlans, err := s.completeVLANManager.CompleteVLANDiscovery(device)
		if err == nil {
			// Save VLANs to database
			s.saveVLANs(vlans)
		}

		// Discover firewall policies
		policies, err := s.firewallManager.DiscoverFirewallPolicies(device)
		if err == nil {
			// Save firewall policies to database
			s.saveFirewallPolicies(policies)
		}
	}

	return nil
}

func (s *Service) GetTopology(c *gin.Context) (NetworkTopology, error) {
	// This would return the complete network topology
	// For now, return mock data
	// This would return the complete network topology (Legacy method, prefer using TopologyAnalyzer)
	return NetworkTopology{
		Devices: []TopologyDevice{},
		Links:   []TopologyLink{},
	}, nil
}

func (s *Service) GetVLANs(c *gin.Context, deviceID uint) ([]CompleteVLANInfo, error) {
	var device models.Device
	err := s.db.First(&device, deviceID).Error
	if err != nil {
		return nil, err
	}

	return s.completeVLANManager.CompleteVLANDiscovery(device)
}

func (s *Service) GetFirewallPolicies(c *gin.Context, deviceID uint) ([]FirewallPolicy, error) {
	var device models.Device
	err := s.db.First(&device, deviceID).Error
	if err != nil {
		return nil, err
	}

	return s.firewallManager.DiscoverFirewallPolicies(device)
}

func (s *Service) GetWirelessNetworks(c *gin.Context, deviceID uint) ([]WirelessNetworkInfo, error) {
	var device models.Device
	err := s.db.First(&device, deviceID).Error
	if err != nil {
		return nil, err
	}

	return s.wirelessManager.CompleteWirelessDiscovery(device)
}

func (s *Service) GetVLANTrunkTopology(c *gin.Context) ([]TrunkLink, error) {
	return s.vlanVisualizer.GetVLANTrunkTopology()
}

// Helper methods to save topology data (placeholder implementations)
func (s *Service) saveVLANs(vlans []CompleteVLANInfo) {
	// Save each VLAN to database
	for _, vlanInfo := range vlans {
		// Convert CompleteVLANInfo to database model
		vlan := models.VLAN{
			DeviceID:    vlanInfo.DeviceID,
			VLANID:      vlanInfo.VLANID,
			Name:        vlanInfo.Name,
			Description: vlanInfo.Description,
			Status:      vlanInfo.Status,
			MTU:         vlanInfo.MTU,
			Shutdown:    vlanInfo.Shutdown,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		// Save VLAN to database
		if err := s.db.Create(&vlan).Error; err != nil {
			// Log error but continue processing other VLANs
			// In production, you might want to use a proper logger
			continue
		}

		// Save VLAN interfaces
		for _, interfaceInfo := range vlanInfo.Interfaces {
			// Convert allowed VLANs to JSON string
			allowedVLANsJSON, _ := json.Marshal(interfaceInfo.AllowedVLANs)

			vlanInterface := models.VLANInterface{
				VLANID:        vlan.ID,
				InterfaceName: interfaceInfo.InterfaceName,
				Mode:          interfaceInfo.Mode,
				NativeVLAN:    interfaceInfo.NativeVLAN,
				AllowedVLANs:  string(allowedVLANsJSON),
				Tagged:        interfaceInfo.Tagged,
				CreatedAt:     time.Now(),
				UpdatedAt:     time.Now(),
			}

			if err := s.db.Create(&vlanInterface).Error; err != nil {
				// Log error but continue processing other interfaces
				continue
			}
		}
	}
}

func (s *Service) saveFirewallPolicies(policies []FirewallPolicy) {
	// Save each firewall policy to database
	for _, policy := range policies {
		// Convert FirewallPolicy to database model (if we had one)
		// For now, just log the policy
		// In a complete implementation, you would create a FirewallPolicy model
		// and save it to the database similar to how we handle VLANs
		_ = policy
	}
}

func (s *Service) saveTopologyLinks(sourceDeviceID uint, neighbors []EnhancedCDPNeighbor) {
	for _, neighbor := range neighbors {
		link := models.NetworkLink{
			SourceDeviceID:  sourceDeviceID,
			SourceInterface: neighbor.LocalInterface,
			DestInterface:   neighbor.RemoteInterface,
			LinkType:        "cdp",
			Status:          "up",
			LastDiscovery:   time.Now(),
		}

		// Try to find remote device in DB by IP or Hostname
		var remoteDevice models.Device
		if err := s.db.Where("ip_address = ?", neighbor.RemoteIP).Or("hostname = ?", neighbor.RemoteHostname).First(&remoteDevice).Error; err == nil {
			link.DestDeviceID = remoteDevice.ID
		}

		// Save link (upsert based on source/dest/interface)
		var existingLink models.NetworkLink
		err := s.db.Where("source_device_id = ? AND source_interface = ? AND link_type = ?",
			link.SourceDeviceID, link.SourceInterface, "cdp").First(&existingLink).Error

		if err == nil {
			// Update existing
			s.db.Model(&existingLink).Updates(link)
		} else {
			// Create new
			s.db.Create(&link)
		}
	}
}

func (s *Service) saveLLDPNeighbors(sourceDeviceID uint, neighbors []EnhancedLLDPNeighbor) {
	for _, neighbor := range neighbors {
		link := models.NetworkLink{
			SourceDeviceID:  sourceDeviceID,
			SourceInterface: neighbor.LocalInterface,
			DestInterface:   neighbor.RemoteInterface,
			LinkType:        "lldp",
			Status:          "up",
			LastDiscovery:   time.Now(),
		}

		// Try to find remote device in DB by IP or Hostname
		var remoteDevice models.Device
		if err := s.db.Where("ip_address = ?", neighbor.RemoteIP).Or("hostname = ?", neighbor.RemoteHostname).First(&remoteDevice).Error; err == nil {
			link.DestDeviceID = remoteDevice.ID
		}

		// Save link (upsert)
		var existingLink models.NetworkLink
		err := s.db.Where("source_device_id = ? AND source_interface = ? AND link_type = ?",
			link.SourceDeviceID, link.SourceInterface, "lldp").First(&existingLink).Error

		if err == nil {
			s.db.Model(&existingLink).Updates(link)
		} else {
			s.db.Create(&link)
		}
	}
}
