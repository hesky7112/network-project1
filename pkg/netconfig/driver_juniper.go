package netconfig

import (
	"strings"
)

type JuniperDriver struct {
	BaseDriver
}

var juniperParser = NewGenericParser()

func init() {
	juniperParser.AddTemplate("show version", `(?i)JUNOS\s+Software.*Version\s+\[(?P<version>[\d\.\(a-z\)]+)\]`)
	juniperParser.AddTemplate("show interfaces terse", `(?i)(?P<interface>\w+-\d+/\d+/\d+)\s+(?P<admin>up|down)\s+(?P<link>up|down)\s+(?P<proto>inet|inet6)\s+(?P<address>\d+\.\d+\.\d+\.\d+/\d+)`)
	juniperParser.AddTemplate("show route", `(?i)(?P<network>\d+\.\d+\.\d+\.\d+/\d+)\s+\[(?P<proto>\w+)/(?P<pref>\d+)\]\s+>\s+to\s+(?P<next_hop>\d+\.\d+\.\d+\.\d+)\s+via\s+(?P<interface>\w+-\d+/\d+/\d+)`)

	RegisterDriver("juniper", &JuniperDriver{})
}

func (d *JuniperDriver) GetConfig(conn DeviceConnection) (string, error) {
	commands := []string{
		"set cli screen-length 0",
		"show configuration",
	}
	return d.RunSimpleCommands(conn, commands)
}

func (d *JuniperDriver) ApplyConfig(conn DeviceConnection, config string) error {
	// Juniper uses 'load set' or 'load override' for config push
	// For simplicity in this demo, we assume the config block is formatted for 'load'
	return d.PushConfig(conn, config, "configure", "commit and-quit", "")
}

func (d *JuniperDriver) CleanConfig(config string) string {
	lines := strings.Split(config, "\n")
	var cleanLines []string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		// Remove Juniper timestamps and comments
		if strings.HasPrefix(trimmed, "#") ||
			strings.Contains(trimmed, "Configuration format version") {
			continue
		}
		cleanLines = append(cleanLines, line)
	}

	return strings.Join(cleanLines, "\n")
}

func (d *JuniperDriver) ParseOutput(command, output string) (interface{}, error) {
	return juniperParser.Parse(command, output)
}
