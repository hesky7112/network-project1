package admin

import (
	"bufio"
	"fmt"
	"networking-main/internal/models"
	"os"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

func (s *Service) ListUsers(c *gin.Context) ([]models.User, error) {
	var users []models.User
	err := s.db.Find(&users).Error
	return users, err
}

func (s *Service) CreateUser(c *gin.Context, user models.User) error {
	return s.db.Create(&user).Error
}

func (s *Service) UpdateUser(c *gin.Context, id string, user models.User) error {
	return s.db.Model(&models.User{}).Where("id = ?", id).Updates(user).Error
}

func (s *Service) DeleteUser(c *gin.Context, id string) error {
	return s.db.Delete(&models.User{}, id).Error
}

func (s *Service) GetSettings(c *gin.Context) (map[string]interface{}, error) {
	var settings []models.SystemSetting
	if err := s.db.Find(&settings).Error; err != nil {
		return nil, err
	}

	result := make(map[string]interface{})
	for _, setting := range settings {
		result[setting.Key] = setting.Value
	}
	return result, nil
}

func (s *Service) UpdateSettings(c *gin.Context, settings map[string]interface{}) error {
	for key, value := range settings {
		valStr := fmt.Sprintf("%v", value)
		// Use Upsert logic
		var setting models.SystemSetting
		err := s.db.Where("key = ?", key).First(&setting).Error
		if err == gorm.ErrRecordNotFound {
			setting = models.SystemSetting{
				Key:   key,
				Value: valStr,
			}
			if err := s.db.Create(&setting).Error; err != nil {
				return err
			}
		} else if err == nil {
			if err := s.db.Model(&setting).Update("value", valStr).Error; err != nil {
				return err
			}
		} else {
			return err
		}
	}
	return nil
}

func (s *Service) GetLogs(c *gin.Context) ([]string, error) {
	file, err := os.Open("server.log")
	if err != nil {
		// Fallback to backend.log if server.log is missing
		file, err = os.Open("backend.log")
		if err != nil {
			return nil, err
		}
	}
	defer file.Close()

	var logs []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		logs = append(logs, scanner.Text())
	}

	// Limit to last 200 lines
	if len(logs) > 200 {
		logs = logs[len(logs)-200:]
	}

	return logs, scanner.Err()
}

func (s *Service) ExportBackup(c *gin.Context) error {
	// Simple JSON export of devices and configurations
	var devices []models.Device
	s.db.Find(&devices)

	c.JSON(200, gin.H{
		"backup_version": "1.0",
		"devices":        devices,
	})
	return nil
}

func (s *Service) ImportBackup(c *gin.Context) error {
	// Placeholder for complex import
	return nil
}
