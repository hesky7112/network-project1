package snmp

import (
	"strings"
	"sync"
)

// MIBRegistry handles the mapping of numerical OIDs to human-readable names
type MIBRegistry struct {
	oidMap map[string]string
	mu     sync.RWMutex
}

// NewMIBRegistry creates a new registry with default common OIDs
func NewMIBRegistry() *MIBRegistry {
	r := &MIBRegistry{
		oidMap: make(map[string]string),
	}
	r.loadDefaults()
	return r
}

func (r *MIBRegistry) loadDefaults() {
	// Standard IF-MIB
	r.oidMap[".1.3.6.1.2.1.2.2.1.1"] = "ifIndex"
	r.oidMap[".1.3.6.1.2.1.2.2.1.2"] = "ifDescr"
	r.oidMap[".1.3.6.1.2.1.2.2.1.7"] = "ifAdminStatus"
	r.oidMap[".1.3.6.1.2.1.2.2.1.8"] = "ifOperStatus"
	r.oidMap[".1.3.6.1.6.3.1.1.5.3"] = "linkDown"
	r.oidMap[".1.3.6.1.6.3.1.1.5.4"] = "linkUp"

	// HOST-RESOURCES-MIB
	r.oidMap[".1.3.6.1.2.1.25.3.3.1.2"] = "hrProcessorLoad"
	r.oidMap[".1.3.6.1.2.1.25.2.3.1.6"] = "hrStorageUsed"
	r.oidMap[".1.3.6.1.2.1.1.5.0"] = "sysName"
}

// Translate converts an OID to its readable name if available
// Returns the original OID if no match is found
func (r *MIBRegistry) Translate(oid string) string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// Direct match
	if name, ok := r.oidMap[oid]; ok {
		return name
	}

	// Prefix match check (simplistic MIB walking simulation)
	for prefix, name := range r.oidMap {
		if strings.HasPrefix(oid, prefix) {
			return name + strings.TrimPrefix(oid, prefix)
		}
	}

	return oid
}

// RuleEngine evaluates processed traps against criteria to determine severity/actions
type RuleEngine struct {
	rules []Rule
}

type Rule struct {
	Name      string
	Condition func(oid, value string) bool
	Severity  string
}

func NewRuleEngine() *RuleEngine {
	return &RuleEngine{
		rules: []Rule{
			{
				Name: "Critical Link Down",
				Condition: func(oid, value string) bool {
					// Detects linkDown OID or ifOperStatus=Down(2)
					return strings.Contains(oid, "linkDown") || (strings.Contains(oid, "ifOperStatus") && value == "2")
				},
				Severity: "critical",
			},
			{
				Name: "High Processor Load",
				Condition: func(oid, value string) bool {
					return strings.Contains(oid, "hrProcessorLoad") && value > "90"
				},
				Severity: "warning",
			},
		},
	}
}

func (re *RuleEngine) Evaluate(oid, value string) string {
	for _, rule := range re.rules {
		if rule.Condition(oid, value) {
			return rule.Severity
		}
	}
	return "info"
}
