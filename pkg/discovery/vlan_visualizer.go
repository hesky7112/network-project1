package discovery

import (
	"networking-main/internal/models"

	"gorm.io/gorm"
)

type VLANVisualizer struct {
	db *gorm.DB
}

type TrunkLink struct {
	SourceDevice string `json:"source_device"`
	SourcePort   string `json:"source_port"`
	DestDevice   string `json:"dest_device"`
	AllowedVLANs string `json:"allowed_vlans"` // "1-100,200"
	NativeVLAN   int    `json:"native_vlan"`
}

func NewVLANVisualizer(db *gorm.DB) *VLANVisualizer {
	return &VLANVisualizer{db: db}
}

// GetVLANTrunkTopology returns trunk links with VLAN info
func (vv *VLANVisualizer) GetVLANTrunkTopology() ([]TrunkLink, error) {
	var links []models.NetworkLink
	// Find all CDP/LLDP links
	if err := vv.db.Where("link_type IN ?", []string{"cdp", "lldp"}).Find(&links).Error; err != nil {
		return nil, err
	}

	var trunks []TrunkLink

	for _, link := range links {
		// Get Interface details for source
		// We need to query VLANInterface table which stores switchport info
		// Assuming we have SourceDeviceID and SourceInterface

		var vlanInt models.VLANInterface
		err := vv.db.Where("device_id = ? AND interface_name = ? AND mode = ?",
			link.SourceDeviceID, link.SourceInterface, "trunk").First(&vlanInt).Error

		if err == nil {
			// Found a trunk interface on the source side
			// Get Device Names
			var srcDev, dstDev models.Device
			vv.db.First(&srcDev, link.SourceDeviceID)
			vv.db.First(&dstDev, link.DestDeviceID)

			trunks = append(trunks, TrunkLink{
				SourceDevice: srcDev.Hostname,
				SourcePort:   link.SourceInterface,
				DestDevice:   dstDev.Hostname,
				AllowedVLANs: vlanInt.AllowedVLANs,
				NativeVLAN:   vlanInt.NativeVLAN,
			})
		}
	}

	return trunks, nil
}
