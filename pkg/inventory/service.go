package inventory

import (
	"fmt"
	"networking-main/internal/models"
	"networking-main/pkg/sshpool"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/ssh"
	"gorm.io/gorm"
)

type Service struct {
	db         *gorm.DB
	sshPool    *sshpool.Pooler
	macTracker *MACTracker
}

func NewService(db *gorm.DB) *Service {
	return &Service{
		db:         db,
		sshPool:    sshpool.NewPooler(),
		macTracker: NewMACTracker(db),
	}
}

func (s *Service) ListDevices(c *gin.Context) ([]models.Device, error) {
	var devices []models.Device
	err := s.db.Find(&devices).Error
	return devices, err
}

func (s *Service) GetDevice(c *gin.Context, id string) (models.Device, error) {
	var device models.Device
	err := s.db.First(&device, id).Error
	return device, err
}

func (s *Service) CreateDevice(c *gin.Context, device models.Device) error {
	return s.db.Create(&device).Error
}

func (s *Service) UpdateDevice(c *gin.Context, id string, device models.Device) error {
	return s.db.Model(&models.Device{}).Where("id = ?", id).Updates(device).Error
}

func (s *Service) DeleteDevice(c *gin.Context, id string) error {
	return s.db.Delete(&models.Device{}, id).Error
}

// ExecuteCommand runs a remote command on a device via SSH
func (s *Service) ExecuteCommand(ctx *gin.Context, deviceID uint, cmd string) (string, error) {
	var device models.Device
	if err := s.db.First(&device, deviceID).Error; err != nil {
		return "", err
	}

	// King Tier: Use the persistent SSH pool
	config := &ssh.ClientConfig{
		User: device.Username, // Assuming these fields exist or use defaults
		Auth: []ssh.AuthMethod{
			ssh.Password(device.Password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // For internal trusted network
		Timeout:         5 * time.Second,
	}

	// Add port if missing
	addr := fmt.Sprintf("%s:22", device.IPAddress)

	// Ensure connection exists
	_, err := s.sshPool.GetClient(addr, config)
	if err != nil {
		return "", err
	}

	return s.sshPool.ExecuteCommand(ctx, addr, cmd)
}
