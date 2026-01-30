package netconfig

import (
	"strings"
)

type CiscoDriver struct {
	BaseDriver
}

var ciscoParser = NewGenericParser()

func init() {
	ciscoParser.AddTemplate("show version", `(?i)Cisco\s+IOS\s+Software.*Version\s+(?P<version>[\d\.\(a-z\)]+).*\s+uptime\s+is\s+(?P<uptime>.*)`)
	ciscoParser.AddTemplate("show inventory", `(?i)NAME:\s+"(?P<name>[^"]+)".*SN:\s+(?P<serial>\w+)`)
	ciscoParser.AddTemplate("show interfaces", `(?i)(?P<interface>\w+Ethernet[\d/]+)\s+is\s+(?P<status>up|down|administratively down).*\s+address\s+is\s+(?P<mac>[0-9a-f\.]{14})`)
	ciscoParser.AddTemplate("show ip route", `(?i)(?P<protocol>[L|C|S|R|B|O|D|i])\**\s+(?P<network>\d+\.\d+\.\d+\.\d+/\d+).*\svia\s+(?P<next_hop>\d+\.\d+\.\d+\.\d+)`)

	RegisterDriver("cisco", &CiscoDriver{})
}

func (d *CiscoDriver) GetConfig(conn DeviceConnection) (string, error) {
	commands := []string{
		"terminal length 0",
		"show running-config",
	}
	return d.RunSimpleCommands(conn, commands)
}

func (d *CiscoDriver) ApplyConfig(conn DeviceConnection, config string) error {
	return d.PushConfig(conn, config, "configure terminal", "end", "write memory")
}

func (d *CiscoDriver) CleanConfig(config string) string {
	lines := strings.Split(config, "\n")
	var cleanLines []string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		// Remove Cisco specific noise
		if strings.Contains(trimmed, "Building configuration...") ||
			strings.Contains(trimmed, "Current configuration") ||
			strings.Contains(trimmed, "Last configuration change") ||
			strings.Contains(trimmed, "NVRAM config last updated") ||
			(strings.HasPrefix(trimmed, "!") && len(strings.Trim(trimmed, "! \t")) == 0) {
			continue
		}
		cleanLines = append(cleanLines, line)
	}

	return strings.Join(cleanLines, "\n")
}

func (d *CiscoDriver) ParseOutput(command, output string) (interface{}, error) {
	return ciscoParser.Parse(command, output)
}
