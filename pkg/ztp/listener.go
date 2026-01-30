package ztp

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	"networking-main/internal/models"
	"networking-main/pkg/netconfig"

	"gorm.io/gorm"
)

// ZTPListener handles Zero Touch Provisioning for network devices
type ZTPListener struct {
	db          *gorm.DB
	httpServer  *http.Server
	ipamManager *IPAMManager
	configMgr   *netconfig.ConfigManager
	port        int
}

// DeviceRegistration represents a device registration request
type DeviceRegistration struct {
	SerialNumber string `json:"serial_number"`
	MACAddress   string `json:"mac_address"`
	Model        string `json:"model"`
	Vendor       string `json:"vendor"`
	IPAddress    string `json:"ip_address,omitempty"`
	Hostname     string `json:"hostname,omitempty"`
}

// ProvisioningResponse represents the response to a device registration
type ProvisioningResponse struct {
	Success      bool   `json:"success"`
	Message      string `json:"message"`
	IPAddress    string `json:"ip_address"`
	Hostname     string `json:"hostname"`
	VLANID       int    `json:"vlan_id"`
	Gateway      string `json:"gateway"`
	DNSServers   []string `json:"dns_servers"`
	NTPServers   []string `json:"ntp_servers"`
	ConfigURL    string `json:"config_url"`
	ConfigScript string `json:"config_script,omitempty"`
}

// NewZTPListener creates a new ZTP listener
func NewZTPListener(db *gorm.DB, port int) *ZTPListener {
	return &ZTPListener{
		db:          db,
		port:        port,
		ipamManager: NewIPAMManager(db),
		configMgr:   &netconfig.ConfigManager{},
	}
}

// Start starts the ZTP HTTP server
func (zl *ZTPListener) Start() error {
	mux := http.NewServeMux()
	
	// ZTP endpoints
	mux.HandleFunc("/ztp/register", zl.HandleDeviceRegistration)
	mux.HandleFunc("/ztp/config/", zl.HandleConfigDownload)
	mux.HandleFunc("/ztp/status/", zl.HandleProvisioningStatus)
	mux.HandleFunc("/ztp/callback", zl.HandleProvisioningCallback)

	zl.httpServer = &http.Server{
		Addr:         fmt.Sprintf(":%d", zl.port),
		Handler:      mux,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	fmt.Printf("ZTP Listener started on port %d\n", zl.port)
	return zl.httpServer.ListenAndServe()
}

// Stop stops the ZTP HTTP server
func (zl *ZTPListener) Stop() error {
	if zl.httpServer != nil {
		return zl.httpServer.Close()
	}
	return nil
}

// HandleDeviceRegistration handles device registration requests
func (zl *ZTPListener) HandleDeviceRegistration(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var reg DeviceRegistration
	if err := json.NewDecoder(r.Body).Decode(&reg); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate registration
	if reg.SerialNumber == "" || reg.MACAddress == "" {
		http.Error(w, "Serial number and MAC address are required", http.StatusBadRequest)
		return
	}

	// Check if device already exists
	var existingDevice models.Device
	result := zl.db.Where("serial_number = ? OR mac_address = ?", reg.SerialNumber, reg.MACAddress).First(&existingDevice)
	
	if result.Error == nil {
		// Device already registered
		response := zl.buildProvisioningResponse(&existingDevice)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Create new device
	device := models.Device{
		SerialNumber: reg.SerialNumber,
		MACAddress:   reg.MACAddress,
		DeviceType:   fmt.Sprintf("%s %s", reg.Vendor, reg.Model),
		Status:       "provisioning",
		CreatedAt:    time.Now(),
	}

	// Assign IP address
	ipAddr, err := zl.AssignIP(&device)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to assign IP: %v", err), http.StatusInternalServerError)
		return
	}
	device.IPAddress = ipAddr

	// Assign VLAN
	vlanID, err := zl.AssignVLAN(&device)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to assign VLAN: %v", err), http.StatusInternalServerError)
		return
	}

	// Generate hostname
	device.Hostname = zl.GenerateHostname(&device)

	// Save device
	if err := zl.db.Create(&device).Error; err != nil {
		http.Error(w, fmt.Sprintf("Failed to create device: %v", err), http.StatusInternalServerError)
		return
	}

	// Push initial configuration
	go zl.PushInitialConfig(&device)

	// Build response
	response := ProvisioningResponse{
		Success:    true,
		Message:    "Device registered successfully",
		IPAddress:  device.IPAddress,
		Hostname:   device.Hostname,
		VLANID:     vlanID,
		Gateway:    zl.ipamManager.GetGateway(vlanID),
		DNSServers: []string{"8.8.8.8", "8.8.4.4"},
		NTPServers: []string{"pool.ntp.org"},
		ConfigURL:  fmt.Sprintf("http://%s:%d/ztp/config/%d", zl.getServerIP(), zl.port, device.ID),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

	fmt.Printf("ZTP: Registered device %s (SN: %s, MAC: %s)\n", device.Hostname, reg.SerialNumber, reg.MACAddress)
}

// HandleConfigDownload serves the initial configuration for a device
func (zl *ZTPListener) HandleConfigDownload(w http.ResponseWriter, r *http.Request) {
	// Extract device ID from URL
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid URL", http.StatusBadRequest)
		return
	}

	deviceID := parts[3]

	var device models.Device
	if err := zl.db.Where("id = ?", deviceID).First(&device).Error; err != nil {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	// Generate initial configuration
	config := zl.GenerateInitialConfig(&device)

	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte(config))

	fmt.Printf("ZTP: Served config for device %s\n", device.Hostname)
}

// HandleProvisioningStatus returns the provisioning status of a device
func (zl *ZTPListener) HandleProvisioningStatus(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid URL", http.StatusBadRequest)
		return
	}

	deviceID := parts[3]

	var device models.Device
	if err := zl.db.Where("id = ?", deviceID).First(&device).Error; err != nil {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	status := map[string]interface{}{
		"device_id":  device.ID,
		"hostname":   device.Hostname,
		"status":     device.Status,
		"ip_address": device.IPAddress,
		"updated_at": device.UpdatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// HandleProvisioningCallback handles callbacks from devices after provisioning
func (zl *ZTPListener) HandleProvisioningCallback(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var callback struct {
		DeviceID uint   `json:"device_id"`
		Status   string `json:"status"`
		Message  string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&callback); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Update device status
	err := zl.db.Model(&models.Device{}).
		Where("id = ?", callback.DeviceID).
		Updates(map[string]interface{}{
			"status":     callback.Status,
			"updated_at": time.Now(),
		}).Error

	if err != nil {
		http.Error(w, "Failed to update device status", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})

	fmt.Printf("ZTP: Device %d callback - Status: %s, Message: %s\n", callback.DeviceID, callback.Status, callback.Message)
}

// AssignIP assigns an IP address to a device
func (zl *ZTPListener) AssignIP(device *models.Device) (string, error) {
	// Use IPAM manager to allocate IP
	return zl.ipamManager.AllocateIP(device)
}

// AssignVLAN assigns a VLAN to a device based on policies
func (zl *ZTPListener) AssignVLAN(device *models.Device) (int, error) {
	// Default VLAN assignment logic
	// In production, this would be policy-based

	if strings.Contains(strings.ToLower(device.DeviceType), "switch") {
		return 10, nil // Management VLAN
	} else if strings.Contains(strings.ToLower(device.DeviceType), "router") {
		return 20, nil // Router VLAN
	} else if strings.Contains(strings.ToLower(device.DeviceType), "ap") || 
	          strings.Contains(strings.ToLower(device.DeviceType), "wireless") {
		return 30, nil // Wireless VLAN
	}

	return 100, nil // Default VLAN
}

// GenerateHostname generates a hostname for a device
func (zl *ZTPListener) GenerateHostname(device *models.Device) string {
	// Extract device type
	deviceType := "device"
	if strings.Contains(strings.ToLower(device.DeviceType), "switch") {
		deviceType = "sw"
	} else if strings.Contains(strings.ToLower(device.DeviceType), "router") {
		deviceType = "rtr"
	} else if strings.Contains(strings.ToLower(device.DeviceType), "ap") {
		deviceType = "ap"
	}

	// Generate unique hostname
	// Format: <type>-<location>-<number>
	// For now, use serial number suffix
	serialSuffix := device.SerialNumber
	if len(serialSuffix) > 6 {
		serialSuffix = serialSuffix[len(serialSuffix)-6:]
	}

	return fmt.Sprintf("%s-site01-%s", deviceType, serialSuffix)
}

// PushInitialConfig pushes the initial configuration to a device
func (zl *ZTPListener) PushInitialConfig(device *models.Device) error {
	// Wait for device to be ready
	time.Sleep(10 * time.Second)

	// In production, push config via SSH or API
	fmt.Printf("ZTP: Pushing initial config to %s (%s)\n", device.Hostname, device.IPAddress)

	// Update device status
	zl.db.Model(device).Updates(map[string]interface{}{
		"status":     "active",
		"updated_at": time.Now(),
	})

	return nil
}

// GenerateInitialConfig generates the initial configuration for a device
func (zl *ZTPListener) GenerateInitialConfig(device *models.Device) string {
	config := fmt.Sprintf(`!
! Initial ZTP Configuration for %s
! Generated: %s
!
hostname %s
!
interface Management1
 ip address %s 255.255.255.0
 no shutdown
!
ip route 0.0.0.0 0.0.0.0 %s
!
ntp server pool.ntp.org
!
snmp-server community public RO
snmp-server location Site-01
snmp-server contact admin@example.com
!
end
`, device.Hostname, time.Now().Format(time.RFC3339), device.Hostname, device.IPAddress, zl.ipamManager.GetGateway(100))

	return config
}

// buildProvisioningResponse builds a provisioning response for an existing device
func (zl *ZTPListener) buildProvisioningResponse(device *models.Device) ProvisioningResponse {
	return ProvisioningResponse{
		Success:    true,
		Message:    "Device already registered",
		IPAddress:  device.IPAddress,
		Hostname:   device.Hostname,
		VLANID:     100, // Default
		Gateway:    zl.ipamManager.GetGateway(100),
		DNSServers: []string{"8.8.8.8", "8.8.4.4"},
		NTPServers: []string{"pool.ntp.org"},
		ConfigURL:  fmt.Sprintf("http://%s:%d/ztp/config/%d", zl.getServerIP(), zl.port, device.ID),
	}
}

// getServerIP gets the server's IP address
func (zl *ZTPListener) getServerIP() string {
	// Get first non-loopback IP
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "localhost"
	}

	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}

	return "localhost"
}
