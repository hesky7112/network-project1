package ipam

import (
	"context"
	"errors"
	"fmt"
	"net"
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

// CreatePool creates a new IP pool
func (s *Service) CreatePool(ctx context.Context, pool *models.IPPool) error {
	_, _, err := net.ParseCIDR(pool.Subnet)
	if err != nil {
		return fmt.Errorf("invalid subnet: %w", err)
	}
	return s.db.WithContext(ctx).Create(pool).Error
}

// AllocateIP finds and reserves an available IP in the given pool
func (s *Service) AllocateIP(ctx context.Context, poolID uint, userID uint, mac string) (*models.IPLease, error) {
	var pool models.IPPool
	if err := s.db.WithContext(ctx).First(&pool, poolID).Error; err != nil {
		return nil, err
	}

	// 1. Check if user already has an active lease in this pool
	var existingLease models.IPLease
	err := s.db.WithContext(ctx).Where("pool_id = ? AND (user_id = ? OR mac_address = ?) AND status = ?", poolID, userID, mac, "active").First(&existingLease).Error
	if err == nil {
		return &existingLease, nil
	}

	// 2. Find available IPs
	// This is a simplified implementation. In a real ISP system, we'd use a bitmask or tracking table.
	allIPs, err := s.generateIPs(pool.StartIP, pool.EndIP)
	if err != nil {
		return nil, err
	}

	var usedIPs []string
	s.db.WithContext(ctx).Model(&models.IPLease{}).Where("pool_id = ? AND status = ?", poolID, "active").Pluck("ip_address", &usedIPs)

	usedMap := make(map[string]bool)
	for _, ip := range usedIPs {
		usedMap[ip] = true
	}

	var targetIP string
	for _, ip := range allIPs {
		if !usedMap[ip] {
			targetIP = ip
			break
		}
	}

	if targetIP == "" {
		return nil, errors.New("no available IPs in pool")
	}

	// 3. Create Lease
	lease := &models.IPLease{
		PoolID:     poolID,
		UserID:     userID,
		IPAddress:  targetIP,
		MACAddress: mac,
		Status:     "active",
		ExpiresAt:  time.Now().Add(24 * time.Hour), // Default 24h lease
	}

	if err := s.db.WithContext(ctx).Create(lease).Error; err != nil {
		return nil, err
	}

	return lease, nil
}

func (s *Service) generateIPs(start, end string) ([]string, error) {
	startIP := net.ParseIP(start)
	endIP := net.ParseIP(end)
	if startIP == nil || endIP == nil {
		return nil, errors.New("invalid start or end IP")
	}

	var ips []string
	for ip := startIP; s.ipLessEqual(ip, endIP); s.incIP(ip) {
		ips = append(ips, ip.String())
		if len(ips) > 1000 { // Safety limit for this simulation
			break
		}
	}
	return ips, nil
}

func (s *Service) ipLessEqual(ip1, ip2 net.IP) bool {
	ip1 = ip1.To4()
	ip2 = ip2.To4()
	for i := 0; i < 4; i++ {
		if ip1[i] < ip2[i] {
			return true
		}
		if ip1[i] > ip2[i] {
			return false
		}
	}
	return true
}

func (s *Service) incIP(ip net.IP) {
	for j := len(ip) - 1; j >= 0; j-- {
		ip[j]++
		if ip[j] > 0 {
			break
		}
	}
}

// ReleaseLease marks a lease as released
func (s *Service) ReleaseLease(ctx context.Context, leaseID uint) error {
	return s.db.WithContext(ctx).Model(&models.IPLease{}).Where("id = ?", leaseID).Update("status", "released").Error
}
