package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Username  string         `json:"username" gorm:"uniqueIndex;not null"`
	Email     string         `json:"email" gorm:"uniqueIndex;not null"`
	Password  string         `json:"-" gorm:"not null"`
	Role      string         `json:"role" gorm:"default:'viewer'"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

type Device struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	IPAddress    string         `json:"ip_address" gorm:"uniqueIndex;not null"`
	MACAddress   string         `json:"mac_address"`
	Hostname     string         `json:"hostname"`
	Vendor       string         `json:"vendor"`
	DeviceType   string         `json:"device_type"`
	OS           string         `json:"os"`
	SNMPVersion  string         `json:"snmp_version"`
	Community    string         `json:"community"`
	Username     string         `json:"username"`
	Password     string         `json:"password"`
	Location     string         `json:"location"`
	Latitude     float64        `json:"latitude"`
	Longitude    float64        `json:"longitude"`
	Notes        string         `json:"notes"`
	SerialNumber string         `json:"serial_number"`
	Status       string         `json:"status" gorm:"default:'unknown'"`
	LastSeen     time.Time      `json:"last_seen"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

type ConfigBackup struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	DeviceID  uint           `json:"device_id" gorm:"not null"`
	Device    Device         `json:"device" gorm:"foreignKey:DeviceID"`
	Config    string         `json:"config" gorm:"type:text"`
	Version   string         `json:"version"`
	Tags      string         `json:"tags"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

type TelemetryData struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	DeviceID  uint           `json:"device_id" gorm:"not null"`
	Device    Device         `json:"device" gorm:"foreignKey:DeviceID"`
	Metric    string         `json:"metric" gorm:"not null"`
	Value     float64        `json:"value"`
	Unit      string         `json:"unit"`
	Timestamp time.Time      `json:"timestamp"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

type DiscoveryJob struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Subnet      string         `json:"subnet" gorm:"not null"`
	Status      string         `json:"status" gorm:"default:'pending'"`
	Progress    int            `json:"progress" gorm:"default:0"`
	Results     string         `json:"results" gorm:"type:text"`
	Error       string         `json:"error"`
	StartedAt   time.Time      `json:"started_at"`
	CompletedAt time.Time      `json:"completed_at"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

type NetworkAlert struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	DeviceID     *uint          `json:"device_id"`
	Device       *Device        `json:"device" gorm:"foreignKey:DeviceID"`
	Type         string         `json:"type" gorm:"not null"`
	Severity     string         `json:"severity" gorm:"default:'info'"`
	Message      string         `json:"message" gorm:"not null"`
	Acknowledged bool           `json:"acknowledged" gorm:"default:false"`
	Resolved     bool           `json:"resolved" gorm:"default:false"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

type VLAN struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	DeviceID    uint           `json:"device_id" gorm:"not null"`
	Device      Device         `json:"device" gorm:"foreignKey:DeviceID"`
	VLANID      int            `json:"vlan_id" gorm:"not null"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Status      string         `json:"status" gorm:"default:'active'"`
	MTU         int            `json:"mtu" gorm:"default:1500"`
	Shutdown    bool           `json:"shutdown" gorm:"default:false"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

type VLANInterface struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	VLANID        uint           `json:"vlan_id" gorm:"not null"`
	VLAN          VLAN           `json:"vlan" gorm:"foreignKey:VLANID"`
	InterfaceName string         `json:"interface_name" gorm:"not null"`
	Mode          string         `json:"mode" gorm:"default:'access'"`
	NativeVLAN    int            `json:"native_vlan"`
	AllowedVLANs  string         `json:"allowed_vlans"` // JSON string of allowed VLANs
	Tagged        bool           `json:"tagged" gorm:"default:false"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

type SystemSetting struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Key       string         `json:"key" gorm:"uniqueIndex;not null"`
	Value     string         `json:"value" gorm:"type:text"`
	Type      string         `json:"type" gorm:"default:'string'"`
	Category  string         `json:"category" gorm:"default:'general'"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

type Workflow struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"not null"`
	Description string         `json:"description"`
	TriggerType string         `json:"trigger_type"` // cron, webhook, manual
	CronSched   string         `json:"cron_sched"`
	Definition  string         `json:"definition" gorm:"type:text"` // JSON string of nodes/edges
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
