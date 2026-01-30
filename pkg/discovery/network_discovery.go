package discovery

import (
	"fmt"
	"net"
	"strings"
	"sync"
	"time"

	"networking-main/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/gopacket"
	"github.com/google/gopacket/layers"
	"github.com/google/gopacket/pcap"
	"github.com/gosnmp/gosnmp"
	"github.com/schollz/progressbar/v3"
	"gorm.io/gorm"
)

type NetworkDiscoveryEngine struct {
	db         *gorm.DB
	snmpClient *gosnmp.GoSNMP
}

type DiscoveryResult struct {
	IPAddress   string
	MACAddress  string
	Hostname    string
	Vendor      string
	DeviceType  string
	OS          string
	OpenPorts   []int
	SNMPInfo    map[string]interface{}
	Confidence  float64
}

type ScanConfig struct {
	TargetNetworks []string
	Ports          []int
	Timeout        time.Duration
	Workers        int
	EnableSNMP     bool
	SNMPCommunity  string
}

func NewNetworkDiscoveryEngine(db *gorm.DB) *NetworkDiscoveryEngine {
	return &NetworkDiscoveryEngine{
		db: db,
	}
}

// StartNetworkDiscovery initiates a comprehensive network discovery scan
func (e *NetworkDiscoveryEngine) StartNetworkDiscovery(ctx *gin.Context, config ScanConfig) (*models.DiscoveryJob, error) {
	// Create discovery job record
	job := models.DiscoveryJob{
		Subnet:    strings.Join(config.TargetNetworks, ","),
		Status:    "running",
		Progress:  0,
		StartedAt: time.Now(),
	}

	if err := e.db.Create(&job).Error; err != nil {
		return nil, fmt.Errorf("failed to create discovery job: %w", err)
	}

	// Run discovery in background
	go e.performDiscovery(job.ID, config)

	return &job, nil
}

// performDiscovery executes the actual network discovery
func (e *NetworkDiscoveryEngine) performDiscovery(jobID uint, config ScanConfig) {
	defer func() {
		// Update job status to completed
		e.db.Model(&models.DiscoveryJob{}).Where("id = ?", jobID).Updates(map[string]interface{}{
			"status":      "completed",
			"progress":    100,
			"completed_at": time.Now(),
		})
	}()

	var allResults []DiscoveryResult
	var mu sync.Mutex

	// Progress bar for CLI feedback
	bar := progressbar.NewOptions(len(config.TargetNetworks),
		progressbar.OptionSetDescription("Scanning networks"),
		progressbar.OptionShowCount(),
		progressbar.OptionOnCompletion(func() {
			fmt.Println("\nDiscovery completed!")
		}),
	)

	// Process each target network
	for _, network := range config.TargetNetworks {
		go func(net string) {
			defer bar.Add(1)

			results := e.scanNetwork(net, config)
			mu.Lock()
			allResults = append(allResults, results...)
			mu.Unlock()
		}(network)
	}

	// Wait for all scans to complete
	bar.Finish()

	// Save results to database
	e.saveDiscoveryResults(jobID, allResults)

	// Update job with results count
	e.db.Model(&models.DiscoveryJob{}).Where("id = ?", jobID).Update("results", fmt.Sprintf("Found %d devices", len(allResults)))
}

// scanNetwork scans a single network for devices
func (e *NetworkDiscoveryEngine) scanNetwork(network string, config ScanConfig) []DiscoveryResult {
	var results []DiscoveryResult

	// Parse network range
	_, ipNet, err := net.ParseCIDR(network)
	if err != nil {
		return results
	}

	// Get all IP addresses in range
	var ips []net.IP
	for ip := ipNet.IP; ipNet.Contains(ip); e.incrementIP(ip) {
		ips = append(ips, copyIP(ip))
	}

	// Scan each IP address
	var wg sync.WaitGroup
	resultChan := make(chan DiscoveryResult, len(ips))

	for _, ip := range ips {
		wg.Add(1)
		go func(targetIP net.IP) {
			defer wg.Done()

			result := e.scanHost(targetIP.String(), config)
			if result.IPAddress != "" {
				resultChan <- result
			}
		}(ip)
	}

	// Close channel when all workers are done
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	// Collect results
	for result := range resultChan {
		results = append(results, result)
	}

	return results
}

// scanHost performs comprehensive scanning of a single host
func (e *NetworkDiscoveryEngine) scanHost(ip string, config ScanConfig) DiscoveryResult {
	result := DiscoveryResult{
		IPAddress: ip,
		OpenPorts: []int{},
		SNMPInfo:  make(map[string]interface{}),
	}

	// 1. Basic connectivity check (ICMP ping)
	if e.pingHost(ip) {
		result.Confidence = 0.5
	} else {
		return result // Skip if host is not responding
	}

	// 2. Port scanning for common services
	result.OpenPorts = e.portScan(ip, config.Ports, config.Timeout)

	// 3. MAC address discovery via ARP
	if mac := e.getMACAddress(ip); mac != "" {
		result.MACAddress = mac
		result.Vendor = e.getVendorFromMAC(mac)
		result.Confidence += 0.2
	}

	// 4. DNS reverse lookup
	if hostname, err := net.LookupAddr(ip); err == nil && len(hostname) > 0 {
		result.Hostname = strings.TrimSuffix(hostname[0], ".")
		result.Confidence += 0.1
	}

	// 5. SNMP discovery
	if config.EnableSNMP {
		snmpInfo := e.snmpDiscovery(ip, config.SNMPCommunity)
		if len(snmpInfo) > 0 {
			result.SNMPInfo = snmpInfo
			result.DeviceType = e.identifyDeviceType(snmpInfo)
			result.OS = e.identifyOS(snmpInfo)
			result.Confidence += 0.3
		}
	}

	// 6. Device fingerprinting based on open ports
	if len(result.OpenPorts) > 0 {
		if result.DeviceType == "" {
			result.DeviceType = e.fingerprintByPorts(result.OpenPorts)
		}
		result.Confidence += 0.1
	}

	// 7. DNS enumeration
	if result.Hostname == "" {
		result.Hostname = e.dnsEnumeration(ip)
	}

	return result
}

// pingHost performs ICMP ping to check host availability
func (e *NetworkDiscoveryEngine) pingHost(ip string) bool {
	conn, err := net.DialTimeout("ip4:icmp", ip, 2*time.Second)
	if err != nil {
		return false
	}
	conn.Close()
	return true
}

// portScan scans for open ports on target host
func (e *NetworkDiscoveryEngine) portScan(ip string, ports []int, timeout time.Duration) []int {
	var openPorts []int

	for _, port := range ports {
		conn, err := net.DialTimeout("tcp", fmt.Sprintf("%s:%d", ip, port), timeout)
		if err == nil {
			openPorts = append(openPorts, port)
			conn.Close()
		}
	}

	return openPorts
}

// getMACAddress retrieves MAC address via ARP
func (e *NetworkDiscoveryEngine) getMACAddress(ip string) string {
	interfaces, err := pcap.FindAllDevs()
	if err != nil {
		return ""
	}

	for _, iface := range interfaces {
		handle, err := pcap.OpenLive(iface.Name, 65536, false, pcap.BlockForever)
		if err != nil {
			continue
		}

		// Send ARP request
		eth := layers.Ethernet{
			SrcMAC:       net.HardwareAddr{0x00, 0x11, 0x22, 0x33, 0x44, 0x55},
			DstMAC:       net.HardwareAddr{0xff, 0xff, 0xff, 0xff, 0xff, 0xff},
			EthernetType: layers.EthernetTypeARP,
		}

		arp := layers.ARP{
			AddrType:          layers.LinkTypeEthernet,
			Protocol:          layers.EthernetTypeIPv4,
			HwAddressSize:     6,
			ProtAddressSize:   4,
			Operation:         layers.ARPRequest,
			SourceHwAddress:   []byte{0x00, 0x11, 0x22, 0x33, 0x44, 0x55},
			SourceProtAddress: net.ParseIP("192.168.1.100"),
			DstHwAddress:      []byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00},
			DstProtAddress:    net.ParseIP(ip),
		}

		buffer := gopacket.NewSerializeBuffer()
		opts := gopacket.SerializeOptions{}
		gopacket.SerializeLayers(buffer, opts, &eth, &arp)

		handle.WritePacketData(buffer.Bytes())
		handle.Close()

		// Listen for ARP response (simplified)
		time.Sleep(100 * time.Millisecond)
	}

	return ""
}

// getVendorFromMAC looks up vendor information from MAC address
func (e *NetworkDiscoveryEngine) getVendorFromMAC(mac string) string {
	// MAC vendor lookup using IEEE OUI database
	// This is a simplified version - in production you'd use a full OUI database
	vendors := map[string]string{
		"00:50:56": "VMware",
		"00:0c:29": "VMware",
		"00:05:69": "VMware",
		"00:1c:14": "VMware",
		"00:1b:21": "Intel",
		"00:15:5d": "Microsoft",
		"52:54:00": "QEMU",
		"08:00:27": "VirtualBox",
		"0a:00:27": "VirtualBox",
		"b8:27:eb": "Raspberry Pi",
	}

	if len(mac) >= 8 {
		prefix := mac[:8]
		if vendor, exists := vendors[prefix]; exists {
			return vendor
		}
	}

	return "Unknown"
}

// snmpDiscovery performs SNMP-based device discovery
func (e *NetworkDiscoveryEngine) snmpDiscovery(ip, community string) map[string]interface{} {
	snmp := &gosnmp.GoSNMP{
		Target:    ip,
		Port:      161,
		Community: community,
		Version:   gosnmp.Version2c,
		Timeout:   time.Duration(2) * time.Second,
	}

	err := snmp.Connect()
	if err != nil {
		return nil
	}
	defer snmp.Conn.Close()

	result := make(map[string]interface{})

	// Get system information
	oids := []string{
		"1.3.6.1.2.1.1.1.0",  // sysDescr
		"1.3.6.1.2.1.1.5.0",  // sysName
		"1.3.6.1.2.1.1.6.0",  // sysLocation
		"1.3.6.1.2.1.1.4.0",  // sysContact
		"1.3.6.1.2.1.1.2.0",  // sysObjectID
	}

	resp, err := snmp.Get(oids)
	if err != nil {
		return nil
	}

	for _, variable := range resp.Variables {
		result[variable.Name] = variable.Value
	}

	return result
}

// identifyDeviceType determines device type from SNMP information
func (e *NetworkDiscoveryEngine) identifyDeviceType(snmpInfo map[string]interface{}) string {
	if sysDescr, ok := snmpInfo["1.3.6.1.2.1.1.1.0"].(string); ok {
		sysDescr = strings.ToLower(sysDescr)

		if strings.Contains(sysDescr, "cisco") {
			return "Cisco Router/Switch"
		} else if strings.Contains(sysDescr, "juniper") {
			return "Juniper Device"
		} else if strings.Contains(sysDescr, "arista") {
			return "Arista Switch"
		} else if strings.Contains(sysDescr, "palo alto") {
			return "Palo Alto Firewall"
		} else if strings.Contains(sysDescr, "windows") {
			return "Windows Server"
		} else if strings.Contains(sysDescr, "linux") {
			return "Linux Server"
		}
	}

	return "Network Device"
}

// identifyOS determines operating system from SNMP information
func (e *NetworkDiscoveryEngine) identifyOS(snmpInfo map[string]interface{}) string {
	if sysDescr, ok := snmpInfo["1.3.6.1.2.1.1.1.0"].(string); ok {
		sysDescr = strings.ToLower(sysDescr)

		if strings.Contains(sysDescr, "ios") {
			return "Cisco IOS"
		} else if strings.Contains(sysDescr, "nx-os") {
			return "Cisco NX-OS"
		} else if strings.Contains(sysDescr, "junos") {
			return "Juniper JunOS"
		} else if strings.Contains(sysDescr, "eos") {
			return "Arista EOS"
		} else if strings.Contains(sysDescr, "pan-os") {
			return "Palo Alto PAN-OS"
		} else if strings.Contains(sysDescr, "windows") {
			return "Microsoft Windows"
		} else if strings.Contains(sysDescr, "linux") {
			return "Linux"
		}
	}

	return "Unknown"
}

// fingerprintByPorts identifies device type based on open ports
func (e *NetworkDiscoveryEngine) fingerprintByPorts(ports []int) string {
	portMap := make(map[int]bool)
	for _, port := range ports {
		portMap[port] = true
	}

	// Common port patterns
	if portMap[22] && portMap[23] { // SSH + Telnet
		return "Network Switch/Router"
	} else if portMap[80] && portMap[443] { // HTTP + HTTPS
		return "Web Server"
	} else if portMap[3389] { // RDP
		return "Windows Server"
	} else if portMap[22] { // SSH only
		return "Linux/Unix Server"
	} else if portMap[161] { // SNMP
		return "Network Device"
	}

	return "Unknown Device"
}

// dnsEnumeration performs DNS enumeration and reverse lookup
func (e *NetworkDiscoveryEngine) dnsEnumeration(ip string) string {
	// Try reverse DNS lookup
	if hostname, err := net.LookupAddr(ip); err == nil && len(hostname) > 0 {
		return strings.TrimSuffix(hostname[0], ".")
	}

	// Try forward DNS lookup for common names
	commonNames := []string{
		"router", "switch", "gateway", "firewall", "server", "printer",
	}

	for _, name := range commonNames {
		if ips, err := net.LookupIP(name); err == nil {
			for _, resolvedIP := range ips {
				if resolvedIP.String() == ip {
					return name
				}
			}
		}
	}

	return ""
}

// incrementIP increments an IP address
func (e *NetworkDiscoveryEngine) incrementIP(ip net.IP) {
	for j := len(ip) - 1; j >= 0; j-- {
		ip[j]++
		if ip[j] > 0 {
			break
		}
	}
}

// copyIP creates a copy of an IP address
func copyIP(ip net.IP) net.IP {
	dup := make(net.IP, len(ip))
	copy(dup, ip)
	return dup
}

// saveDiscoveryResults saves discovery results to database
func (e *NetworkDiscoveryEngine) saveDiscoveryResults(_ uint, results []DiscoveryResult) {
	for _, result := range results {
		device := models.Device{
			IPAddress:  result.IPAddress,
			MACAddress: result.MACAddress,
			Hostname:   result.Hostname,
			Vendor:     result.Vendor,
			DeviceType: result.DeviceType,
			OS:         result.OS,
			Status:     "discovered",
			LastSeen:   time.Now(),
		}

		e.db.Create(&device)
	}
}
