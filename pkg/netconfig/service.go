package netconfig

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"networking-main/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Service struct {
	db                          *gorm.DB
	manager                     *ConfigManager
	stpManager                  *STPManager
	etherChannelManager         *EtherChannelManager
	firmwareManager             *FirmwareManager
	enhancedLoadBalancerManager *LoadBalancerManager
	cloudManager                *CloudNetworkManager
	kubernetesManager           *KubernetesClusterManager
	vpnManager                  *VPNManager
	dnsManager                  *DNSManager
	ComplianceManager           *ComplianceManager // Exported
	changeManager               *ChangeManager
	templateManager             *TemplateManager
	spanManager                 *SPANManager
	intentManager               *IntentManager
}

func NewService(db *gorm.DB) *Service {
	s := &Service{
		db:                          db,
		manager:                     &ConfigManager{},
		stpManager:                  &STPManager{db: db},
		etherChannelManager:         &EtherChannelManager{db: db},
		firmwareManager:             &FirmwareManager{db: db},
		enhancedLoadBalancerManager: &LoadBalancerManager{db: db},
		cloudManager:                &CloudNetworkManager{db: db},
		kubernetesManager:           &KubernetesClusterManager{db: db},
		vpnManager:                  &VPNManager{db: db},
		dnsManager:                  &DNSManager{db: db},
		ComplianceManager:           NewComplianceManager(db, &ConfigManager{}),
		changeManager:               NewChangeManager(db),
		templateManager:             NewTemplateManager(db),
		spanManager:                 NewSPANManager(&ConfigManager{}),
		intentManager:               NewIntentManager(db, &ConfigManager{}),
	}
	// Share config manager
	s.ComplianceManager.configManager = s.manager
	s.spanManager.manager = s.manager
	s.intentManager.configManager = s.manager
	return s
}

func (s *Service) ListBackups(c *gin.Context) ([]models.ConfigBackup, error) {
	var backups []models.ConfigBackup
	err := s.db.Preload("Device").Find(&backups).Error
	return backups, err
}

func (s *Service) CreateBackup(c *gin.Context) error {
	var req struct {
		DeviceID uint `json:"device_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		return err
	}

	var device models.Device
	if err := s.db.First(&device, req.DeviceID).Error; err != nil {
		return err
	}

	config, err := s.BackupDeviceConfig(device)
	if err != nil {
		return err
	}

	backup := models.ConfigBackup{
		DeviceID: device.ID,
		Config:   config,
		Version:  fmt.Sprintf("%d", time.Now().Unix()),
		Tags:     "manual-backup",
	}

	return s.db.Create(&backup).Error
}

func (s *Service) RestoreConfig(c *gin.Context, deviceID string) error {
	id, _ := strconv.ParseUint(deviceID, 10, 32)

	// Get the latest backup for the device
	var backup models.ConfigBackup
	err := s.db.Where("device_id = ?", id).Order("created_at desc").First(&backup).Error
	if err != nil {
		return err
	}

	var device models.Device
	if err := s.db.First(&device, uint(id)).Error; err != nil {
		return err
	}

	// Connect to device and push config
	conn := DeviceConnection{
		IPAddress:  device.IPAddress,
		Username:   device.Username,
		Password:   device.Password,
		Port:       22,
		DeviceType: device.DeviceType,
	}

	return s.manager.pushConfigToDevice(conn, backup.Config)
}

func (s *Service) CompareConfigs(c *gin.Context, deviceID string) (string, error) {
	// Get running config (mock)
	runningConfig := "# Running configuration\ninterface GigabitEthernet0/1\n description Current interface\n!"

	// Get backup config
	var backup models.ConfigBackup
	err := s.db.Where("device_id = ?", deviceID).Order("created_at desc").First(&backup).Error
	if err != nil {
		return "", err
	}

	// Generate diff
	diff := s.generateConfigDiff(runningConfig, backup.Config)
	return diff, nil
}

func (s *Service) ApplyTemplate(c *gin.Context) error {
	// Mock template application
	template := ConfigTemplate{
		Name:       "Standard Switch Config",
		DeviceType: "cisco",
		Content:    "interface GigabitEthernet0/1\n description Template applied\n no shutdown\n!",
		Variables:  map[string]string{"interface": "GigabitEthernet0/1"},
	}

	// Apply template logic would go here
	fmt.Printf("Applying template: %s\n", template.Name)
	return nil
}

// RunCommand executes a single command on a device via the ConfigManager
func (s *Service) RunCommand(device models.Device, command string) (string, error) {
	return s.manager.RunCommand(device, command)
}

// Helper method to generate configuration diff
func (s *Service) generateConfigDiff(running, backup string) string {
	runningLines := strings.Split(running, "\n")
	backupLines := strings.Split(backup, "\n")

	var diff strings.Builder
	diff.WriteString("Configuration Differences:\n")
	diff.WriteString("==========================\n\n")

	// Simple line-by-line comparison
	maxLines := len(runningLines)
	if len(backupLines) > maxLines {
		maxLines = len(backupLines)
	}

	for i := 0; i < maxLines; i++ {
		var runningLine, backupLine string
		if i < len(runningLines) {
			runningLine = runningLines[i]
		}
		if i < len(backupLines) {
			backupLine = backupLines[i]
		}

		if runningLine != backupLine {
			if runningLine != "" {
				diff.WriteString(fmt.Sprintf("- %s\n", runningLine))
			}
			if backupLine != "" {
				diff.WriteString(fmt.Sprintf("+ %s\n", backupLine))
			}
		}
	}

	return diff.String()
}

// Advanced configuration management methods
func (s *Service) BackupDeviceConfig(device models.Device) (string, error) {
	conn := DeviceConnection{
		IPAddress:  device.IPAddress,
		Username:   device.Username,
		Password:   device.Password,
		Port:       22,
		DeviceType: device.DeviceType,
	}

	return s.manager.BackupDeviceConfig(conn)
}

func (s *Service) CheckDeviceCompliance(device models.Device, rules []ComplianceRule) []ComplianceResult {
	// Get current config
	config, err := s.BackupDeviceConfig(device)
	if err != nil {
		return []ComplianceResult{{
			RuleName:  "Connection Error",
			Compliant: false,
			Issues:    []string{err.Error()},
			Severity:  "critical",
		}}
	}

	return s.manager.CheckCompliance(config, rules)
}

func (s *Service) ApplyConfigTemplate(device models.Device, template ConfigTemplate) error {
	// TODO: Implement actual template application logic using device connection
	return nil
}

// Advanced configuration methods
// TODO: Implement ConfigureSTP method

func (s *Service) ConfigureEtherChannel(c *gin.Context, deviceID int, config EtherChannelConfig) error {
	var device models.Device
	err := s.db.First(&device, deviceID).Error
	if err != nil {
		return err
	}

	return s.etherChannelManager.ConfigureEtherChannel(device, config)
}

func (s *Service) UpgradeFirmware(c *gin.Context, deviceID int, upgrade FirmwareUpgrade) error {
	var device models.Device
	err := s.db.First(&device, deviceID).Error
	if err != nil {
		return err
	}

	return s.firmwareManager.UpgradeFirmware(device, upgrade)
}

func (s *Service) ConfigureLoadBalancer(c *gin.Context, deviceID int, config EnhancedLoadBalancerConfig) error {
	var device models.Device
	err := s.db.First(&device, deviceID).Error
	if err != nil {
		return err
	}

	return s.enhancedLoadBalancerManager.ConfigureEnhancedLoadBalancer(device, config)
}

func (s *Service) ConfigureCloudNetworking(c *gin.Context, config CloudVPC) error {
	return s.cloudManager.ProvisionAWSVPC(config)
}

func (s *Service) ConfigureKubernetesNetworking(c *gin.Context, config ClusterNetworkConfig) error {
	return s.kubernetesManager.ConfigureMultiClusterNetworking(config)
}

func (s *Service) ConfigureVPN(c *gin.Context, localDeviceID, remoteDeviceID int, tunnel VPNTunnel) error {
	var localDevice, remoteDevice models.Device
	err := s.db.First(&localDevice, localDeviceID).Error
	if err != nil {
		return err
	}

	err = s.db.First(&remoteDevice, remoteDeviceID).Error
	if err != nil {
		return err
	}

	return s.vpnManager.ConfigureSiteToSiteVPN(localDevice, remoteDevice, tunnel)
}

func (s *Service) ManageDNSRecord(c *gin.Context, deviceID int, record DNSRecord) error {
	var device models.Device
	err := s.db.First(&device, deviceID).Error
	if err != nil {
		return err
	}

	return s.dnsManager.ManageDNSRecord(device, record)
}

func (s *Service) DetectConfigDrift(ctx context.Context, deviceID uint) (*ConfigDrift, error) {
	return s.ComplianceManager.DetectDrift(ctx, deviceID)
}

func (s *Service) DetectAllDrift(ctx context.Context) error {
	var devices []models.Device
	s.db.Find(&devices)
	for _, dev := range devices {
		if _, err := s.DetectConfigDrift(ctx, dev.ID); err != nil {
			// Log error but continue
			fmt.Printf("Drift detection failed for %s: %v\n", dev.Hostname, err)
		}
	}
	return nil
}

func (s *Service) ExecuteScheduledChanges(ctx context.Context) error {
	return s.changeManager.ExecuteScheduledChanges(ctx, func(req *ChangeRequest) error {
		// Logic to execute the change
		// 1. Get device connection
		// 2. Push commands
		// This needs to use ConfigManager possibly
		fmt.Printf("Executing change request %d on devices %v\n", req.ID, req.DeviceIDs)
		return nil
	})
}

func (s *Service) RenderTemplate(name string, vars map[string]interface{}) (string, error) {
	// Try to get standard template first
	content := s.templateManager.GetStandardTemplate(name)
	if content == "" {
		// Try DB/Custom lookup (not implemented yet in manager, but structure supports it)
		// For now just error or return empty
		return "", fmt.Errorf("template not found: %s", name)
	}
	return s.templateManager.RenderTemplate(content, vars)
}

func (s *Service) ApplyNetworkIntent(ctx context.Context, intent NetworkIntent) ([]string, error) {
	return s.intentManager.ApplyIntent(ctx, intent)
}
