package netconfig

import (
	"strings"
)

type AristaDriver struct {
	BaseDriver
}

var aristaParser = NewGenericParser()

func init() {
	aristaParser.AddTemplate("show version", `(?i)Arista\s+vEOS.*Version\s+(?P<version>[\d\.\(a-z\)]+)`)
	aristaParser.AddTemplate("show interfaces status", `(?i)(?P<interface>Et\d+)\s+(?P<desc>[^ ]+)\s+(?P<status>connected|notconnect)\s+(?P<vlan>\d+|trunk)\s+(?P<duplex>full|half)\s+(?P<speed>10G|1G|100M)`)

	RegisterDriver("arista", &AristaDriver{})
}

func (d *AristaDriver) GetConfig(conn DeviceConnection) (string, error) {
	commands := []string{
		"show running-config",
	}
	return d.RunSimpleCommands(conn, commands)
}

func (d *AristaDriver) ApplyConfig(conn DeviceConnection, config string) error {
	return d.PushConfig(conn, config, "configure terminal", "end", "write memory")
}

func (d *AristaDriver) CleanConfig(config string) string {
	lines := strings.Split(config, "\n")
	var cleanLines []string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		// Remove Arista timestamps
		if strings.Contains(trimmed, "Last configuration change") ||
			(strings.HasPrefix(trimmed, "!") && len(strings.Trim(trimmed, "! \t")) == 0) {
			continue
		}
		cleanLines = append(cleanLines, line)
	}

	return strings.Join(cleanLines, "\n")
}

func (d *AristaDriver) ParseOutput(command, output string) (interface{}, error) {
	return aristaParser.Parse(command, output)
}
