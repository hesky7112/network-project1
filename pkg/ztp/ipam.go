package ztp

import (
	"fmt"
	"net"
	"sync"

	"networking-main/internal/models"

	"gorm.io/gorm"
)

// IPAMManager manages IP address allocation
type IPAMManager struct {
	db     *gorm.DB
	mutex  sync.RWMutex
	pools  map[int]*IPPool // VLAN ID -> IP Pool
}

// IPPool represents an IP address pool for a VLAN
type IPPool struct {
	VLANID      int
	Network     string
	Gateway     string
	StartIP     string
	EndIP       string
	Allocated   map[string]bool
	mutex       sync.RWMutex
}

// IPAllocation represents an allocated IP address
type IPAllocation struct {
	ID        uint   `json:"id" gorm:"primaryKey"`
	IPAddress string `json:"ip_address" gorm:"uniqueIndex"`
	MACAddress string `json:"mac_address"`
	DeviceID  *uint  `json:"device_id"`
	VLANID    int    `json:"vlan_id"`
	Status    string `json:"status"` // "allocated", "reserved", "free"
	AllocatedAt string `json:"allocated_at"`
}

// NewIPAMManager creates a new IPAM manager
func NewIPAMManager(db *gorm.DB) *IPAMManager {
	ipam := &IPAMManager{
		db:    db,
		pools: make(map[int]*IPPool),
	}

	// Auto-migrate
	db.AutoMigrate(&IPAllocation{})

	// Initialize default pools
	ipam.initializeDefaultPools()

	return ipam
}

// initializeDefaultPools sets up default IP pools
func (ipam *IPAMManager) initializeDefaultPools() {
	// Management VLAN (10)
	ipam.AddPool(10, "10.0.10.0/24", "10.0.10.1", "10.0.10.10", "10.0.10.254")

	// Router VLAN (20)
	ipam.AddPool(20, "10.0.20.0/24", "10.0.20.1", "10.0.20.10", "10.0.20.254")

	// Wireless VLAN (30)
	ipam.AddPool(30, "10.0.30.0/24", "10.0.30.1", "10.0.30.10", "10.0.30.254")

	// Default VLAN (100)
	ipam.AddPool(100, "10.0.100.0/24", "10.0.100.1", "10.0.100.10", "10.0.100.254")
}

// AddPool adds an IP pool for a VLAN
func (ipam *IPAMManager) AddPool(vlanID int, network, gateway, startIP, endIP string) error {
	ipam.mutex.Lock()
	defer ipam.mutex.Unlock()

	pool := &IPPool{
		VLANID:    vlanID,
		Network:   network,
		Gateway:   gateway,
		StartIP:   startIP,
		EndIP:     endIP,
		Allocated: make(map[string]bool),
	}

	ipam.pools[vlanID] = pool
	return nil
}

// AllocateIP allocates an IP address for a device
func (ipam *IPAMManager) AllocateIP(device *models.Device) (string, error) {
	// Determine VLAN (default to 100 for now)
	vlanID := 100

	ipam.mutex.RLock()
	pool, exists := ipam.pools[vlanID]
	ipam.mutex.RUnlock()

	if !exists {
		return "", fmt.Errorf("no IP pool found for VLAN %d", vlanID)
	}

	// Find next available IP
	ip, err := ipam.findNextAvailableIP(pool)
	if err != nil {
		return "", err
	}

	// Mark as allocated
	pool.mutex.Lock()
	pool.Allocated[ip] = true
	pool.mutex.Unlock()

	// Save to database
	allocation := IPAllocation{
		IPAddress:  ip,
		MACAddress: device.MACAddress,
		VLANID:     vlanID,
		Status:     "allocated",
		AllocatedAt: fmt.Sprintf("%v", device.CreatedAt),
	}

	if err := ipam.db.Create(&allocation).Error; err != nil {
		// Rollback allocation
		pool.mutex.Lock()
		delete(pool.Allocated, ip)
		pool.mutex.Unlock()
		return "", err
	}

	return ip, nil
}

// findNextAvailableIP finds the next available IP in a pool
func (ipam *IPAMManager) findNextAvailableIP(pool *IPPool) (string, error) {
	startIP := net.ParseIP(pool.StartIP)
	endIP := net.ParseIP(pool.EndIP)

	if startIP == nil || endIP == nil {
		return "", fmt.Errorf("invalid IP range")
	}

	// Convert to uint32 for iteration
	start := ipToUint32(startIP)
	end := ipToUint32(endIP)

	pool.mutex.RLock()
	defer pool.mutex.RUnlock()

	for i := start; i <= end; i++ {
		ip := uint32ToIP(i).String()
		if !pool.Allocated[ip] {
			// Check if already allocated in database
			var count int64
			ipam.db.Model(&IPAllocation{}).Where("ip_address = ? AND status = ?", ip, "allocated").Count(&count)
			if count == 0 {
				return ip, nil
			}
		}
	}

	return "", fmt.Errorf("no available IPs in pool")
}

// ReleaseIP releases an allocated IP address
func (ipam *IPAMManager) ReleaseIP(ipAddress string) error {
	// Update database
	err := ipam.db.Model(&IPAllocation{}).
		Where("ip_address = ?", ipAddress).
		Update("status", "free").Error

	if err != nil {
		return err
	}

	// Update pool
	ipam.mutex.RLock()
	for _, pool := range ipam.pools {
		pool.mutex.Lock()
		delete(pool.Allocated, ipAddress)
		pool.mutex.Unlock()
	}
	ipam.mutex.RUnlock()

	return nil
}

// GetGateway returns the gateway for a VLAN
func (ipam *IPAMManager) GetGateway(vlanID int) string {
	ipam.mutex.RLock()
	defer ipam.mutex.RUnlock()

	if pool, exists := ipam.pools[vlanID]; exists {
		return pool.Gateway
	}

	return "10.0.0.1" // Default gateway
}

// GetPoolInfo returns information about an IP pool
func (ipam *IPAMManager) GetPoolInfo(vlanID int) (map[string]interface{}, error) {
	ipam.mutex.RLock()
	pool, exists := ipam.pools[vlanID]
	ipam.mutex.RUnlock()

	if !exists {
		return nil, fmt.Errorf("pool not found for VLAN %d", vlanID)
	}

	pool.mutex.RLock()
	defer pool.mutex.RUnlock()

	info := map[string]interface{}{
		"vlan_id":   pool.VLANID,
		"network":   pool.Network,
		"gateway":   pool.Gateway,
		"start_ip":  pool.StartIP,
		"end_ip":    pool.EndIP,
		"allocated": len(pool.Allocated),
	}

	return info, nil
}

// ListAllocations lists all IP allocations
func (ipam *IPAMManager) ListAllocations(vlanID int) ([]IPAllocation, error) {
	var allocations []IPAllocation
	query := ipam.db.Where("status = ?", "allocated")

	if vlanID > 0 {
		query = query.Where("vlan_id = ?", vlanID)
	}

	if err := query.Find(&allocations).Error; err != nil {
		return nil, err
	}

	return allocations, nil
}

// ReserveIP reserves an IP address
func (ipam *IPAMManager) ReserveIP(ipAddress string, vlanID int, macAddress string) error {
	allocation := IPAllocation{
		IPAddress:  ipAddress,
		MACAddress: macAddress,
		VLANID:     vlanID,
		Status:     "reserved",
	}

	return ipam.db.Create(&allocation).Error
}

// Helper functions

// ipToUint32 converts an IP address to uint32
func ipToUint32(ip net.IP) uint32 {
	ip = ip.To4()
	return uint32(ip[0])<<24 | uint32(ip[1])<<16 | uint32(ip[2])<<8 | uint32(ip[3])
}

// uint32ToIP converts uint32 to IP address
func uint32ToIP(n uint32) net.IP {
	return net.IPv4(byte(n>>24), byte(n>>16), byte(n>>8), byte(n))
}
