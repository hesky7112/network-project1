package models

import (
	"time"

	"gorm.io/gorm"
)

// STPConfig represents Spanning Tree Protocol configuration
type STPConfig struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	DeviceID     uint           `json:"device_id" gorm:"index"`
	Device       Device         `json:"device" gorm:"foreignKey:DeviceID"`
	Mode         string         `json:"mode"` // "pvst", "rapid-pvst", "mst"
	Priority     int            `json:"priority"`
	RootBridge   string         `json:"root_bridge"`
	RootPort     string         `json:"root_port"`
	BridgeID     string         `json:"bridge_id"`
	MaxAge       int            `json:"max_age"`
	HelloTime    int            `json:"hello_time"`
	ForwardDelay int            `json:"forward_delay"`
	Interfaces   string         `json:"interfaces" gorm:"type:text"` // JSON string of interface configs
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// EtherChannelConfig represents EtherChannel/Link Aggregation
type EtherChannelConfig struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	Name             string         `json:"name"`
	DeviceID         uint           `json:"device_id" gorm:"index"`
	Device           Device         `json:"device" gorm:"foreignKey:DeviceID"`
	Mode             string         `json:"mode"` // "static", "lacp", "pagp"
	LoadBalance      string         `json:"load_balance"`
	MemberInterfaces string         `json:"member_interfaces" gorm:"type:text"` // JSON array
	Protocol         string         `json:"protocol"`
	MinimumLinks     int            `json:"minimum_links"`
	MaximumLinks     int            `json:"maximum_links"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// FirmwareUpgrade represents a firmware upgrade operation
type FirmwareUpgrade struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	DeviceID       uint           `json:"device_id" gorm:"index"`
	Device         Device         `json:"device" gorm:"foreignKey:DeviceID"`
	CurrentVersion string         `json:"current_version"`
	TargetVersion  string         `json:"target_version"`
	ImageURL       string         `json:"image_url"`
	ImageFile      string         `json:"image_file"`
	UpgradeMethod  string         `json:"upgrade_method"`
	ServerIP       string         `json:"server_ip"`
	PreCheck       bool           `json:"pre_check"`
	PostCheck      bool           `json:"post_check"`
	BackupConfig   bool           `json:"backup_config"`
	ScheduledTime  time.Time      `json:"scheduled_time"`
	Status         string         `json:"status"` // "pending", "running", "completed", "failed"
	StartedAt      time.Time      `json:"started_at"`
	CompletedAt    time.Time      `json:"completed_at"`
	ErrorMessage   string         `json:"error_message"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// LoadBalancerConfig represents load balancer configuration
type LoadBalancerConfig struct {
	ID                 uint           `json:"id" gorm:"primaryKey"`
	Name               string         `json:"name"`
	DeviceID           uint           `json:"device_id" gorm:"index"`
	Device             Device         `json:"device" gorm:"foreignKey:DeviceID"`
	VIP                string         `json:"vip"`
	Protocol           string         `json:"protocol"`
	Port               int            `json:"port"`
	Algorithm          string         `json:"algorithm"`
	SSLCertificate     string         `json:"ssl_certificate"`
	HealthCheck        string         `json:"health_check" gorm:"type:text"`        // JSON
	SessionPersistence string         `json:"session_persistence" gorm:"type:text"` // JSON
	AutoScaling        string         `json:"auto_scaling" gorm:"type:text"`        // JSON
	Members            string         `json:"members" gorm:"type:text"`             // JSON
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// CloudConnectionConfig represents Direct Connect/ExpressRoute
type CloudConnectionConfig struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	Name       string         `json:"name"`
	Provider   string         `json:"provider"` // "aws", "azure", "gcp"
	Region     string         `json:"region"`
	Type       string         `json:"type"` // "direct-connect", "transit-gateway"
	Bandwidth  string         `json:"bandwidth"`
	VLAN       int            `json:"vlan"`
	PeerIP     string         `json:"peer_ip"`
	CustomerIP string         `json:"customer_ip"`
	BGPASN     int            `json:"bgp_asn"`
	Details    string         `json:"details" gorm:"type:text"` // JSON for specific details
	Status     string         `json:"status"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// K8sClusterConfig represents Kubernetes Cluster configuration
type K8sClusterConfig struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	Name             string         `json:"name"`
	PrimaryClusterID uint           `json:"primary_cluster_id"`
	ServiceMeshType  string         `json:"service_mesh_type"`
	NetworkPolicy    string         `json:"network_policy"`
	ConfigJSON       string         `json:"config_json" gorm:"type:text"`
	Status           string         `json:"status"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// VPNConfig represents Site-to-Site VPN configuration
type VPNConfig struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	Name           string         `json:"name"`
	LocalDeviceID  uint           `json:"local_device_id" gorm:"index"`
	RemoteDeviceID uint           `json:"remote_device_id" gorm:"index"`
	LocalIP        string         `json:"local_ip"`
	RemoteIP       string         `json:"remote_ip"`
	PreSharedKey   string         `json:"pre_shared_key"`
	Protocol       string         `json:"protocol"` // "ikev2", "ipsec"
	Status         string         `json:"status"`   // "up", "down", "provisioning"
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// DNSRecordConfig represents DNS record
type DNSRecordConfig struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	DeviceID  uint           `json:"device_id" gorm:"index"`
	Name      string         `json:"name"`
	Type      string         `json:"type"` // "A", "CNAME", "TXT"
	Value     string         `json:"value"`
	TTL       int            `json:"ttl"`
	Status    string         `json:"status"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
