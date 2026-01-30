package netconfig

import (
	"fmt"
	"regexp"
)

// Parser helper for individual vendor drivers
type GenericParser struct {
	Templates map[string]*regexp.Regexp
}

func NewGenericParser() *GenericParser {
	return &GenericParser{
		Templates: make(map[string]*regexp.Regexp),
	}
}

// AddTemplate adds a named regex with named groups
func (p *GenericParser) AddTemplate(name, pattern string) {
	p.Templates[name] = regexp.MustCompile(pattern)
}

// Parse extracts named groups into a map
func (p *GenericParser) Parse(command, output string) (map[string]string, error) {
	re, ok := p.Templates[command]
	if !ok {
		return nil, fmt.Errorf("no parser template for command: %s", command)
	}

	match := re.FindStringSubmatch(output)
	if match == nil {
		return nil, fmt.Errorf("failed to parse output for: %s", command)
	}

	result := make(map[string]string)
	for i, name := range re.SubexpNames() {
		if i != 0 && name != "" {
			result[name] = match[i]
		}
	}

	return result, nil
}
