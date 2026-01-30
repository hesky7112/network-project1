package health

import (
	"encoding/json"
	"fmt"
	"time"

	"networking-main/internal/models"
	"networking-main/pkg/auth"

	"gorm.io/gorm"
)

// HealthAnalysisEngine performs comprehensive system and network health analysis
type HealthAnalysisEngine struct {
	db              *gorm.DB
	recoveryEngine  *RecoveryEngine
	disasterManager *DisasterManager
}

// HealthStatus represents overall health status
type HealthStatus string

const (
	HealthStatusHealthy  HealthStatus = "healthy"
	HealthStatusDegraded HealthStatus = "degraded"
	HealthStatusCritical HealthStatus = "critical"
	HealthStatusFailed   HealthStatus = "failed"
)

// SeverityLevel represents the severity of a health issue
const (
	SeverityCritical SeverityLevel = "critical"
	SeverityHigh     SeverityLevel = "high"
	SeverityMedium   SeverityLevel = "medium"
	SeverityLow      SeverityLevel = "low"
	SeverityInfo     SeverityLevel = "info"
)

// SeverityLevel is a custom type for issue severity
// This allows for type-safe switch statements and better code organization
type SeverityLevel string

// String returns the string representation of the severity level
func (s SeverityLevel) String() string {
	return string(s)
}

// IsValid checks if the severity level is valid
func (s SeverityLevel) IsValid() bool {
	switch s {
	case SeverityCritical, SeverityHigh, SeverityMedium, SeverityLow, SeverityInfo:
		return true
	default:
		return false
	}
}

// RiskLevel represents the risk level of a quick fix
const (
	RiskLevelLow    string = "low"
	RiskLevelMedium string = "medium"
	RiskLevelHigh   string = "high"
)

// HealthAnalysis represents a comprehensive health analysis
type HealthAnalysis struct {
	ID              uint                   `json:"id" gorm:"primaryKey"`
	Timestamp       time.Time              `json:"timestamp"`
	OverallStatus   HealthStatus           `json:"overall_status"`
	HealthScore     float64                `json:"health_score"` // 0-100
	SystemHealth    *SystemHealthMetrics   `json:"system_health" gorm:"embedded;embeddedPrefix:system_"`
	NetworkHealth   *NetworkHealthMetrics  `json:"network_health" gorm:"embedded;embeddedPrefix:network_"`
	SecurityHealth  *SecurityHealthMetrics `json:"security_health" gorm:"embedded;embeddedPrefix:security_"`
	Issues          string                 `json:"issues" gorm:"type:jsonb"`
	Recommendations string                 `json:"recommendations" gorm:"type:jsonb"`
	QuickFixes      string                 `json:"quick_fixes" gorm:"type:jsonb"`
	RiskLevel       string                 `json:"risk_level"`
	AffectedDevices int                    `json:"affected_devices"`
	EstimatedImpact string                 `json:"estimated_impact"`
}

// SystemHealthMetrics tracks system-level health
type SystemHealthMetrics struct {
	CPUUsageAvg        float64 `json:"cpu_usage_avg"`
	MemoryUsageAvg     float64 `json:"memory_usage_avg"`
	DiskUsageAvg       float64 `json:"disk_usage_avg"`
	ActiveDevices      int     `json:"active_devices"`
	FailedDevices      int     `json:"failed_devices"`
	UptimePercentage   float64 `json:"uptime_percentage"`
	ResponseTimeAvg    float64 `json:"response_time_avg"`
	ErrorRate          float64 `json:"error_rate"`
}

// NetworkHealthMetrics tracks network-level health
type NetworkHealthMetrics struct {
	Bandwidth          float64 `json:"bandwidth"`
	PacketLoss         float64 `json:"packet_loss"`
	Latency            float64 `json:"latency"`
	Jitter             float64 `json:"jitter"`
	ThroughputUtilization float64 `json:"throughput_utilization"`
	ActiveConnections  int     `json:"active_connections"`
	DroppedPackets     int64   `json:"dropped_packets"`
	ErrorPackets       int64   `json:"error_packets"`
	TopologyHealth     float64 `json:"topology_health"`
}

// SecurityHealthMetrics tracks security-level health
type SecurityHealthMetrics struct {
	OpenVulnerabilities int     `json:"open_vulnerabilities"`
	FailedLogins        int     `json:"failed_logins"`
	SuspiciousActivity  int     `json:"suspicious_activity"`
	FirewallRuleViolations int  `json:"firewall_rule_violations"`
	ComplianceScore     float64 `json:"compliance_score"`
	LastSecurityScan    time.Time `json:"last_security_scan"`
}

// HealthIssue represents a detected health issue
type HealthIssue struct {
	ID          uint          `json:"id" gorm:"primaryKey"`
	AnalysisID  uint          `json:"analysis_id"`
	Severity    SeverityLevel `json:"severity"` // critical, high, medium, low
	Category    string        `json:"category"` // system, network, security, performance
	Title       string        `json:"title"`
	Description string        `json:"description"`
	DeviceID    *uint         `json:"device_id"`
	DeviceName  string        `json:"device_name"`
	Metric      string        `json:"metric"`
	CurrentValue float64      `json:"current_value"`
	ThresholdValue float64   `json:"threshold_value"`
	Impact      string        `json:"impact"`
	DetectedAt  time.Time     `json:"detected_at"`
	ResolvedAt  *time.Time    `json:"resolved_at"`
	AutoFixable bool          `json:"auto_fixable"`
}

// QuickFix represents an automated fix suggestion
type QuickFix struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	IssueID     uint      `json:"issue_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	FixType     string    `json:"fix_type"` // automated, manual, hybrid
	Commands    string    `json:"commands" gorm:"type:jsonb"`
	EstimatedTime int     `json:"estimated_time"` // in seconds
	RiskLevel   string    `json:"risk_level"` // low, medium, high
	Prerequisites string  `json:"prerequisites" gorm:"type:jsonb"`
	Rollback    string    `json:"rollback" gorm:"type:jsonb"`
	AppliedAt   *time.Time `json:"applied_at"`
	Success     bool      `json:"success"`
	Result      string    `json:"result"`
}

// NewHealthAnalysisEngine creates a new health analysis engine
func NewHealthAnalysisEngine(db *gorm.DB) *HealthAnalysisEngine {
	engine := &HealthAnalysisEngine{
		db:              db,
		recoveryEngine:  NewRecoveryEngine(db),
		disasterManager: NewDisasterManager(db),
	}

	return engine
}

// PerformComprehensiveAnalysis performs a full health analysis
func (hae *HealthAnalysisEngine) PerformComprehensiveAnalysis() (*HealthAnalysis, error) {
	analysis := &HealthAnalysis{
		Timestamp: time.Now(),
	}

	// Analyze system health
	systemHealth, err := hae.analyzeSystemHealth()
	if err != nil {
		return nil, err
	}
	analysis.SystemHealth = systemHealth

	// Analyze network health
	networkHealth, err := hae.analyzeNetworkHealth()
	if err != nil {
		return nil, err
	}
	analysis.NetworkHealth = networkHealth

	// Analyze security health
	securityHealth, err := hae.analyzeSecurityHealth()
	if err != nil {
		return nil, err
	}
	analysis.SecurityHealth = securityHealth

	// Calculate overall health score
	analysis.HealthScore = hae.calculateHealthScore(systemHealth, networkHealth, securityHealth)
	analysis.OverallStatus = hae.determineOverallStatus(analysis.HealthScore)

	// Detect issues
	issues := hae.detectIssues(systemHealth, networkHealth, securityHealth)
	issuesJSON, _ := json.Marshal(issues)
	analysis.Issues = string(issuesJSON)
	analysis.AffectedDevices = hae.countAffectedDevices(issues)

	// Generate recommendations
	recommendations := hae.generateRecommendations(issues)
	recsJSON, _ := json.Marshal(recommendations)
	analysis.Recommendations = string(recsJSON)

	// Generate quick fixes
	quickFixes := hae.generateQuickFixes(issues)
	fixesJSON, _ := json.Marshal(quickFixes)
	analysis.QuickFixes = string(fixesJSON)

	// Assess risk
	analysis.RiskLevel = hae.assessRiskLevel(issues)
	analysis.EstimatedImpact = hae.estimateImpact(issues)

	// Save analysis
	if err := hae.db.Create(analysis).Error; err != nil {
		return nil, err
	}

	// Save individual issues
	for _, issue := range issues {
		issue.AnalysisID = analysis.ID
		hae.db.Create(&issue)
	}

	// Save quick fixes
	for _, fix := range quickFixes {
		hae.db.Create(&fix)
	}

	return analysis, nil
}

// analyzeSystemHealth analyzes system-level metrics
func (hae *HealthAnalysisEngine) analyzeSystemHealth() (*SystemHealthMetrics, error) {
	metrics := &SystemHealthMetrics{}

	// Query device metrics from database
	var deviceMetrics []struct {
		CPUUsage    float64
		MemoryUsage float64
		DiskUsage   float64
		Status      string
		ResponseTime float64
	}

	hae.db.Raw(`
		SELECT 
			AVG(cpu_usage) as cpu_usage,
			AVG(memory_usage) as memory_usage,
			AVG(disk_usage) as disk_usage,
			status,
			AVG(response_time) as response_time
		FROM devices
		GROUP BY status
	`).Scan(&deviceMetrics)

	// Calculate averages
	totalDevices := 0
	activeDevices := 0
	failedDevices := 0
	var cpuSum, memSum, diskSum, respTimeSum float64

	for _, dm := range deviceMetrics {
		switch dm.Status {
		case "active":
			activeDevices++
			cpuSum += dm.CPUUsage
			memSum += dm.MemoryUsage
			diskSum += dm.DiskUsage
			respTimeSum += dm.ResponseTime
		case "failed":
			failedDevices++
		}
		totalDevices++
	}

	if activeDevices > 0 {
		metrics.CPUUsageAvg = cpuSum / float64(activeDevices)
		metrics.MemoryUsageAvg = memSum / float64(activeDevices)
		metrics.DiskUsageAvg = diskSum / float64(activeDevices)
		metrics.ResponseTimeAvg = respTimeSum / float64(activeDevices)
	}

	metrics.ActiveDevices = activeDevices
	metrics.FailedDevices = failedDevices

	if totalDevices > 0 {
		metrics.UptimePercentage = (float64(activeDevices) / float64(totalDevices)) * 100
	}

	// Calculate error rate
	var errorCount int64
	hae.db.Model(&models.NetworkAlert{}).Where("severity = ? AND created_at > NOW() - INTERVAL '1 hour'", SeverityCritical.String()).Count(&errorCount)
	metrics.ErrorRate = float64(errorCount)

	return metrics, nil
}
func (hae *HealthAnalysisEngine) analyzeNetworkHealth() (*NetworkHealthMetrics, error) {
	metrics := &NetworkHealthMetrics{}

	// Query network metrics from telemetry data
	var netMetrics []models.TelemetryData
	hae.db.Where("metric IN ? AND created_at > NOW() - INTERVAL '5 minutes'",
		[]string{"bandwidth", "packet_loss", "latency", "jitter", "connections"}).
		Find(&netMetrics)

	// Aggregate metrics
	totalBandwidth := 0.0
	totalPacketLoss := 0.0
	totalLatency := 0.0
	totalJitter := 0.0
	connectionCount := 0
	droppedPackets := int64(0)
	errorPackets := int64(0)

	count := 0
	for _, tm := range netMetrics {
		count++
		switch tm.Metric {
		case "bandwidth":
			totalBandwidth += tm.Value
		case "packet_loss":
			totalPacketLoss += tm.Value
		case "latency":
			totalLatency += tm.Value
		case "jitter":
			totalJitter += tm.Value
		case "connections":
			connectionCount = int(tm.Value)
		}
		// For dropped and error packets, we might not have data, use mock values
		droppedPackets += int64(tm.Value * 0.01) // 1% packet loss assumption
		errorPackets += int64(tm.Value * 0.005)  // 0.5% error rate assumption
	}

	if count > 0 {
		metrics.Bandwidth = totalBandwidth / float64(count)
		metrics.PacketLoss = totalPacketLoss / float64(count)
		metrics.Latency = totalLatency / float64(count)
		metrics.Jitter = totalJitter / float64(count)
	} else {
		// Default values if no telemetry data
		metrics.Bandwidth = 100.0 // 100 Mbps
		metrics.PacketLoss = 0.1  // 0.1%
		metrics.Latency = 10.0    // 10ms
		metrics.Jitter = 2.0      // 2ms
	}

	metrics.DroppedPackets = droppedPackets
	metrics.ErrorPackets = errorPackets
	metrics.ActiveConnections = connectionCount

	// Calculate throughput utilization (assuming 1Gbps capacity)
	maxBandwidth := float64(1000000000) // 1 Gbps in bytes
	metrics.ThroughputUtilization = (metrics.Bandwidth / maxBandwidth) * 100

	// Assess topology health
	metrics.TopologyHealth = hae.assessTopologyHealth()

	return metrics, nil
}

// analyzeSecurityHealth analyzes security-level metrics
func (hae *HealthAnalysisEngine) analyzeSecurityHealth() (*SecurityHealthMetrics, error) {
	metrics := &SecurityHealthMetrics{}

	// Query security metrics from available tables
	var vulnerabilities, failedLogins, suspicious, ruleViolations int64

	// Count vulnerabilities (using devices with failed status as proxy)
	hae.db.Model(&models.Device{}).Where("status = ?", "failed").Count(&vulnerabilities)

	// Count failed logins (using audit logs)
	hae.db.Model(&auth.AuditLog{}).Where("success = ? AND timestamp > NOW() - INTERVAL '1 hour'", false).Count(&failedLogins)

	// Count suspicious activity (using alerts with high severity)
	hae.db.Model(&models.NetworkAlert{}).Where("severity IN ? AND created_at > NOW() - INTERVAL '1 hour'", []string{SeverityHigh.String(), SeverityCritical.String()}).Count(&suspicious)

	// Count firewall violations (using alerts as proxy)
	hae.db.Model(&models.NetworkAlert{}).Where("type = ? AND created_at > NOW() - INTERVAL '1 hour'", "security").Count(&ruleViolations)

	metrics.OpenVulnerabilities = int(vulnerabilities)
	metrics.FailedLogins = int(failedLogins)
	metrics.SuspiciousActivity = int(suspicious)
	metrics.FirewallRuleViolations = int(ruleViolations)

	// Calculate compliance score
	metrics.ComplianceScore = hae.calculateComplianceScore()
	metrics.LastSecurityScan = time.Now().Add(-24 * time.Hour) // Mock

	return metrics, nil
}

// calculateHealthScore calculates overall health score (0-100)
func (hae *HealthAnalysisEngine) calculateHealthScore(sys *SystemHealthMetrics, net *NetworkHealthMetrics, sec *SecurityHealthMetrics) float64 {
	score := 100.0

	// System health penalties
	if sys.CPUUsageAvg > 80 {
		score -= 10
	} else if sys.CPUUsageAvg > 60 {
		score -= 5
	}

	if sys.MemoryUsageAvg > 80 {
		score -= 10
	} else if sys.MemoryUsageAvg > 60 {
		score -= 5
	}

	if sys.UptimePercentage < 99 {
		score -= 15
	} else if sys.UptimePercentage < 99.9 {
		score -= 5
	}

	if sys.ErrorRate > 10 {
		score -= 20
	} else if sys.ErrorRate > 5 {
		score -= 10
	}

	// Network health penalties
	if net.PacketLoss > 1 {
		score -= 15
	} else if net.PacketLoss > 0.5 {
		score -= 8
	}

	if net.Latency > 100 {
		score -= 10
	} else if net.Latency > 50 {
		score -= 5
	}

	if net.ThroughputUtilization > 90 {
		score -= 10
	}

	// Security health penalties
	if sec.OpenVulnerabilities > 10 {
		score -= 20
	} else if sec.OpenVulnerabilities > 5 {
		score -= 10
	}

	if sec.FailedLogins > 50 {
		score -= 15
	} else if sec.FailedLogins > 20 {
		score -= 8
	}

	if sec.ComplianceScore < 80 {
		score -= 15
	}

	if score < 0 {
		score = 0
	}

	return score
}

// determineOverallStatus determines overall health status
func (hae *HealthAnalysisEngine) determineOverallStatus(score float64) HealthStatus {
	if score >= 90 {
		return HealthStatusHealthy
	} else if score >= 70 {
		return HealthStatusDegraded
	} else if score >= 50 {
		return HealthStatusCritical
	}
	return HealthStatusFailed
}

// detectIssues detects specific health issues
func (hae *HealthAnalysisEngine) detectIssues(sys *SystemHealthMetrics, net *NetworkHealthMetrics, sec *SecurityHealthMetrics) []HealthIssue {
	issues := []HealthIssue{}

	// System issues
	if sys.CPUUsageAvg > 80 {
		issues = append(issues, HealthIssue{
			Severity:       SeverityCritical,
			Category:       "system",
			Title:          "High CPU Usage",
			Description:    fmt.Sprintf("Average CPU usage is %.1f%%, exceeding threshold", sys.CPUUsageAvg),
			Metric:         "cpu_usage",
			CurrentValue:   sys.CPUUsageAvg,
			ThresholdValue: 80,
			Impact:         "Performance degradation, slow response times",
			DetectedAt:     time.Now(),
			AutoFixable:    true,
		})
	}

	if sys.MemoryUsageAvg > 80 {
		issues = append(issues, HealthIssue{
			Severity:       SeverityHigh,
			Category:       "system",
			Title:          "High Memory Usage",
			Description:    fmt.Sprintf("Average memory usage is %.1f%%, exceeding threshold", sys.MemoryUsageAvg),
			Metric:         "memory_usage",
			CurrentValue:   sys.MemoryUsageAvg,
			ThresholdValue: 80,
			Impact:         "Risk of OOM errors, service crashes",
			DetectedAt:     time.Now(),
			AutoFixable:    true,
		})
	}

	if sys.FailedDevices > 0 {
		issues = append(issues, HealthIssue{
			Severity:       SeverityCritical,
			Category:       "system",
			Title:          "Failed Devices Detected",
			Description:    fmt.Sprintf("%d devices are in failed state", sys.FailedDevices),
			Metric:         "failed_devices",
			CurrentValue:   float64(sys.FailedDevices),
			ThresholdValue: 0,
			Impact:         "Service disruption, network outages",
			DetectedAt:     time.Now(),
			AutoFixable:    true,
		})
	}

	// Network issues
	if net.PacketLoss > 1 {
		issues = append(issues, HealthIssue{
			Severity:       SeverityCritical,
			Category:       "network",
			Title:          "High Packet Loss",
			Description:    fmt.Sprintf("Packet loss is %.2f%%, exceeding threshold", net.PacketLoss),
			Metric:         "packet_loss",
			CurrentValue:   net.PacketLoss,
			ThresholdValue: 1.0,
			Impact:         "Poor application performance, connection drops",
			DetectedAt:     time.Now(),
			AutoFixable:    true,
		})
	}

	if net.Latency > 100 {
		issues = append(issues, HealthIssue{
			Severity:       SeverityHigh,
			Category:       "network",
			Title:          "High Network Latency",
			Description:    fmt.Sprintf("Average latency is %.1fms, exceeding threshold", net.Latency),
			Metric:         "latency",
			CurrentValue:   net.Latency,
			ThresholdValue: 100,
			Impact:         "Slow response times, user experience degradation",
			DetectedAt:     time.Now(),
			AutoFixable:    true,
		})
	}

	// Security issues
	if sec.OpenVulnerabilities > 5 {
		issues = append(issues, HealthIssue{
			Severity:       SeverityHigh,
			Category:       "security",
			Title:          "Multiple Open Vulnerabilities",
			Description:    fmt.Sprintf("%d open vulnerabilities detected", sec.OpenVulnerabilities),
			Metric:         "vulnerabilities",
			CurrentValue:   float64(sec.OpenVulnerabilities),
			ThresholdValue: 5,
			Impact:         "Security risk, potential breach",
			DetectedAt:     time.Now(),
			AutoFixable:    false,
		})
	}

	if sec.FailedLogins > 50 {
		issues = append(issues, HealthIssue{
			Severity:       SeverityCritical,
			Category:       "security",
			Title:          "Excessive Failed Login Attempts",
			Description:    fmt.Sprintf("%d failed login attempts in the last hour", sec.FailedLogins),
			Metric:         "failed_logins",
			CurrentValue:   float64(sec.FailedLogins),
			ThresholdValue: 50,
			Impact:         "Possible brute force attack",
			DetectedAt:     time.Now(),
			AutoFixable:    true,
		})
	}

	return issues
}

// generateQuickFixes generates automated fix suggestions
func (hae *HealthAnalysisEngine) generateQuickFixes(issues []HealthIssue) []QuickFix {
	fixes := []QuickFix{}

	for _, issue := range issues {
		if !issue.AutoFixable {
			continue
		}

		switch issue.Metric {
		case "cpu_usage":
			fixes = append(fixes, QuickFix{
				IssueID:       issue.ID,
				Title:         "Restart High CPU Services",
				Description:   "Identify and restart services consuming excessive CPU",
				FixType:       "automated",
				Commands:      `["systemctl restart high-cpu-service", "docker restart cpu-intensive-container"]`,
				EstimatedTime: 30,
				RiskLevel:     RiskLevelLow,
				Prerequisites: `["backup_running_config"]`,
				Rollback:      `["systemctl start high-cpu-service"]`,
			})

		case "memory_usage":
			fixes = append(fixes, QuickFix{
				IssueID:       issue.ID,
				Title:         "Clear Memory Cache",
				Description:   "Clear system caches and restart memory-intensive services",
				FixType:       "automated",
				Commands:      `["sync; echo 3 > /proc/sys/vm/drop_caches", "systemctl restart memory-intensive-service"]`,
				EstimatedTime: 20,
				RiskLevel:     RiskLevelLow,
				Prerequisites: `[]`,
				Rollback:      `[]`,
			})

		case "failed_devices":
			fixes = append(fixes, QuickFix{
				IssueID:       issue.ID,
				Title:         "Reboot Failed Devices",
				Description:   "Attempt to reboot devices in failed state",
				FixType:       "automated",
				Commands:      `["ssh device 'reboot'", "wait 60", "check_status"]`,
				EstimatedTime: 120,
				RiskLevel:     RiskLevelMedium,
				Prerequisites: `["backup_config", "notify_team"]`,
				Rollback:      `["restore_config"]`,
			})

		case "packet_loss":
			fixes = append(fixes, QuickFix{
				IssueID:       issue.ID,
				Title:         "Optimize Network Routes",
				Description:   "Recalculate and optimize routing tables",
				FixType:       "automated",
				Commands:      `["route flush", "route recalculate", "apply_qos_policies"]`,
				EstimatedTime: 45,
				RiskLevel:     RiskLevelMedium,
				Prerequisites: `["backup_routing_table"]`,
				Rollback:      `["restore_routing_table"]`,
			})

		case "latency":
			fixes = append(fixes, QuickFix{
				IssueID:       issue.ID,
				Title:         "Enable Traffic Prioritization",
				Description:   "Apply QoS policies to prioritize critical traffic",
				FixType:       "automated",
				Commands:      `["apply_qos_template", "restart_network_interfaces"]`,
				EstimatedTime: 30,
				RiskLevel:     RiskLevelLow,
				Prerequisites: `[]`,
				Rollback:      `["remove_qos_policies"]`,
			})

		case "failed_logins":
			fixes = append(fixes, QuickFix{
				IssueID:       issue.ID,
				Title:         "Block Suspicious IPs",
				Description:   "Automatically block IPs with excessive failed login attempts",
				FixType:       "automated",
				Commands:      `["identify_suspicious_ips", "add_firewall_block_rules", "notify_security_team"]`,
				EstimatedTime: 15,
				RiskLevel:     RiskLevelLow,
				Prerequisites: `[]`,
				Rollback:      `["remove_firewall_rules"]`,
			})
		}
	}

	return fixes
}

// generateRecommendations generates human-readable recommendations
func (hae *HealthAnalysisEngine) generateRecommendations(issues []HealthIssue) []string {
	recommendations := []string{}
	categories := make(map[string]bool)

	for _, issue := range issues {
		if categories[issue.Category] {
			continue
		}
		categories[issue.Category] = true

		switch issue.Category {
		case "system":
			recommendations = append(recommendations, "Consider scaling up system resources or optimizing application performance")
			recommendations = append(recommendations, "Review and optimize background processes and scheduled tasks")
		case "network":
			recommendations = append(recommendations, "Analyze network topology for bottlenecks and single points of failure")
			recommendations = append(recommendations, "Implement load balancing and redundancy for critical paths")
		case "security":
			recommendations = append(recommendations, "Conduct immediate security audit and patch vulnerable systems")
			recommendations = append(recommendations, "Implement rate limiting and IP blocking for authentication endpoints")
		}
	}

	return recommendations
}

// Helper functions

func (hae *HealthAnalysisEngine) assessTopologyHealth() float64 {
	// Mock implementation - in production, analyze actual topology
	return 95.0
}

func (hae *HealthAnalysisEngine) calculateComplianceScore() float64 {
	// Mock implementation - in production, check against compliance rules
	return 85.0
}

func (hae *HealthAnalysisEngine) countAffectedDevices(issues []HealthIssue) int {
	deviceMap := make(map[uint]bool)
	for _, issue := range issues {
		if issue.DeviceID != nil {
			deviceMap[*issue.DeviceID] = true
		}
	}
	return len(deviceMap)
}

func (hae *HealthAnalysisEngine) assessRiskLevel(issues []HealthIssue) string {
	criticalCount := 0
	highCount := 0

	for _, issue := range issues {
		switch issue.Severity {
		case SeverityCritical:
			criticalCount++
		case SeverityHigh:
			highCount++
		}
	}

	if criticalCount > 3 {
		return "critical"
	} else if criticalCount > 0 || highCount > 5 {
		return "high"
	} else if highCount > 0 {
		return "medium"
	}
	return "low"
}

func (hae *HealthAnalysisEngine) estimateImpact(issues []HealthIssue) string {
	criticalCount := 0
	for _, issue := range issues {
		if issue.Severity == SeverityCritical {
			criticalCount++
		}
	}

	switch {
	case criticalCount > 5:
		return "Severe - Multiple critical systems affected, immediate action required"
	case criticalCount > 0:
		return "High - Critical issues detected, prompt resolution needed"
	default:
		return "Moderate - Issues detected but systems operational"
	}
}

// ApplyQuickFix applies an automated quick fix
func (hae *HealthAnalysisEngine) ApplyQuickFix(fixID uint) error {
	var fix QuickFix
	if err := hae.db.First(&fix, fixID).Error; err != nil {
		return err
	}

	if fix.FixType != "automated" {
		return fmt.Errorf("fix requires manual intervention")
	}

	// Execute fix via recovery engine
	now := time.Now()
	fix.AppliedAt = &now

	err := hae.recoveryEngine.ExecuteFix(&fix)
	if err != nil {
		fix.Success = false
		fix.Result = fmt.Sprintf("Failed: %v", err)
	} else {
		fix.Success = true
		fix.Result = "Successfully applied"
	}

	hae.db.Save(&fix)
	return err
}

// GetLatestAnalysis retrieves the most recent health analysis
func (hae *HealthAnalysisEngine) GetLatestAnalysis() (*HealthAnalysis, error) {
	var analysis HealthAnalysis
	err := hae.db.Order("timestamp DESC").First(&analysis).Error
	return &analysis, err
}

// GetIssuesByAnalysis retrieves all issues for an analysis
func (hae *HealthAnalysisEngine) GetIssuesByAnalysis(analysisID uint) ([]HealthIssue, error) {
	var issues []HealthIssue
	err := hae.db.Where("analysis_id = ?", analysisID).Find(&issues).Error
	return issues, err
}

// GetQuickFixesByIssue retrieves all quick fixes for an issue
func (hae *HealthAnalysisEngine) GetQuickFixesByIssue(issueID uint) ([]QuickFix, error) {
	var fixes []QuickFix
	err := hae.db.Where("issue_id = ?", issueID).Find(&fixes).Error
	return fixes, err
}
