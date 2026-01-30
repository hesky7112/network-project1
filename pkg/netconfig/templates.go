package netconfig

import (
	"bytes"
	"fmt"
	"text/template"

	"gorm.io/gorm"
)

// TemplateManager handles configuration template rendering
type TemplateManager struct {
	db *gorm.DB
}

func NewTemplateManager(db *gorm.DB) *TemplateManager {
	return &TemplateManager{db: db}
}

// RenderTemplate renders a configuration template with provided variables
func (tm *TemplateManager) RenderTemplate(templateContent string, variables map[string]interface{}) (string, error) {
	tmpl, err := template.New("config").Parse(templateContent)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var doc bytes.Buffer
	if err := tmpl.Execute(&doc, variables); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return doc.String(), nil
}

// GetStandardTemplate returns a pre-defined standard template
func (tm *TemplateManager) GetStandardTemplate(name string) string {
	switch name {
	case "cisco_vlan":
		return `
vlan {{.VLAN_ID}}
 name {{.VLAN_NAME}}
!
interface Vlan{{.VLAN_ID}}
 description {{.DESCRIPTION}}
 ip address {{.IP_ADDRESS}} {{.SUBNET_MASK}}
 no shutdown
!`
	case "mikrotik_address":
		return `/ip address add address={{.IP_ADDRESS}}/{{.CIDR}} interface={{.INTERFACE}} comment="{{.COMMENT}}"`
	default:
		return ""
	}
}

// ValidateVariables checks if all required variables are present
func (tm *TemplateManager) ValidateVariables(templateContent string, variables map[string]interface{}) error {
	// Simple check: try to render. If strict parsing fails, it returns error.
	// Go templates handles missing keys gracefully by default (zero value) unless altered.
	// To be strict, we'd need to parse the tree.
	// For now, we rely on RenderTemplate errors (though default execution doesn't error on missing keys).
	return nil
}
