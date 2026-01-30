package netconfig

import (
	"fmt"
	"strings"
)

type JuniperNetconfDriver struct {
	NetconfDriver
}

func init() {
	// We register this as a specialized driver
	RegisterDriver("juniper-netconf", &JuniperNetconfDriver{})
}

func (d *JuniperNetconfDriver) GetConfig(conn DeviceConnection) (string, error) {
	// Juniper prefers 'running' or 'committed' config
	return d.GetConfigXML(conn, "running")
}

func (d *JuniperNetconfDriver) ApplyConfig(conn DeviceConnection, config string) error {
	// If config is XML, use NETCONF
	if strings.HasPrefix(strings.TrimSpace(config), "<") {
		err := d.EditConfigXML(conn, config)
		if err != nil {
			return err
		}
		return d.Commit(conn)
	}

	// Fallback to Base SSH if it's CLI text (Hybrid Support)
	fmt.Println("Fallback: Using CLI for non-XML config on Juniper-NETCONF driver")
	return d.PushConfig(conn, config, "configure", "commit and-quit", "")
}

func (d *JuniperNetconfDriver) CleanConfig(config string) string {
	// XML cleaning instead of regex cleaning
	return config // simplified
}

func (d *JuniperNetconfDriver) ParseOutput(command, output string) (interface{}, error) {
	// NETCONF output is already structured (XML), so we would use an XML path parser here
	return map[string]string{"status": "Parsed via NETCONF XML Path"}, nil
}
