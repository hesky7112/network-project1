package netconfig

import (
	"regexp"
	"strings"

	"github.com/pmezard/go-difflib/difflib"
)

// SmartDriftDetector handles advanced configuration comparison
type SmartDriftDetector struct {
	ignorePatterns []*regexp.Regexp
}

func NewSmartDriftDetector() *SmartDriftDetector {
	return &SmartDriftDetector{
		ignorePatterns: []*regexp.Regexp{
			// Cisco/Generic noise
			regexp.MustCompile(`^! last configuration change at.*`),
			regexp.MustCompile(`^! nvram config last updated.*`),
			regexp.MustCompile(`^! time:.*`),
			regexp.MustCompile(`^current configuration :.*`),
			regexp.MustCompile(`^building configuration...`),
			regexp.MustCompile(`^ntp clock-period.*`), // Dynamic NTP drift
		},
	}
}

// Normalize cleans a configuration string for comparison
func (d *SmartDriftDetector) Normalize(config string) string {
	lines := strings.Split(config, "\n")
	var cleanLines []string

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || line == "!" {
			continue // Skip empty lines and simple separators
		}

		ignore := false
		for _, pattern := range d.ignorePatterns {
			if pattern.MatchString(strings.ToLower(line)) {
				ignore = true
				break
			}
		}
		if !ignore {
			cleanLines = append(cleanLines, line)
		}
	}
	return strings.Join(cleanLines, "\n")
}

// Compare returns a unified diff if drift is detected, or empty string if match
func (d *SmartDriftDetector) Compare(golden, current string) (string, bool) {
	normGolden := d.Normalize(golden)
	normCurrent := d.Normalize(current)

	if normGolden == normCurrent {
		return "", false
	}

	diff := difflib.UnifiedDiff{
		A:        difflib.SplitLines(normGolden),
		B:        difflib.SplitLines(normCurrent),
		FromFile: "Golden Config",
		ToFile:   "Running Config",
		Context:  3,
	}

	result, _ := difflib.GetUnifiedDiffString(diff)
	return result, true
}
