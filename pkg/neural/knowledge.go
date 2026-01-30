package neural

// SeedKnowledge populates the vector engine with common networking issues and their fixes
func (s *Service) SeedKnowledge() {
	knowledge := []struct {
		id      string
		problem string
		fix     string
		vendor  string
	}{
		{
			id:      "KB-001",
			problem: "OSPF neighbor state is stuck in INIT or EXCHANGE",
			fix:     "clear ip ospf process",
			vendor:  "cisco",
		},
		{
			id:      "KB-002",
			problem: "BGP neighbor is down or flapping wildly",
			fix:     "clear ip bgp * soft",
			vendor:  "cisco",
		},
		{
			id:      "KB-003",
			problem: "Interface input errors or CRC errors increasing",
			fix:     "clear counters",
			vendor:  "cisco",
		},
		{
			id:      "KB-004",
			problem: "Juniper interface shows MTU mismatch or LCP timeout",
			fix:     "restart interface-control",
			vendor:  "juniper",
		},
		{
			id:      "KB-005",
			problem: "High CPU usage due to process churn",
			fix:     "clear ip cache flow",
			vendor:  "cisco",
		},
		{
			id:      "KB-006",
			problem: "Arista interface status is ErrDisabled",
			fix:     "shutdown / no shutdown",
			vendor:  "arista",
		},
	}

	for _, k := range knowledge {
		s.IngestLog(k.id, k.problem, map[string]interface{}{
			"suggested_fix": k.fix,
			"vendor_hint":   k.vendor,
			"type":          "remediation_base",
		})
	}
}
