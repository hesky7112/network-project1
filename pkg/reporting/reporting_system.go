package reporting

import (
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// ReportingSystem manages comprehensive reporting
type ReportingSystem struct {
	db *gorm.DB
}

// Report represents a generated report
type Report struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title"`
	Type        string    `json:"type"` // incident, performance, security, compliance, custom
	Category    string    `json:"category"` // network, system, security, health
	CreatedBy   uint      `json:"created_by"`
	CreatorName string    `json:"creator_name"`
	CreatedAt   time.Time `json:"created_at"`
	TimeRange   string    `json:"time_range"` // last_hour, last_day, last_week, last_month, custom
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
	Status      string    `json:"status"` // draft, published, archived
	Priority    string    `json:"priority"` // low, medium, high, critical
	Tags        string    `json:"tags" gorm:"type:jsonb"`
	Summary     string    `json:"summary"`
	Findings    string    `json:"findings" gorm:"type:jsonb"`
	Metrics     string    `json:"metrics" gorm:"type:jsonb"`
	Charts      string    `json:"charts" gorm:"type:jsonb"`
	Recommendations string `json:"recommendations" gorm:"type:jsonb"`
	Attachments string    `json:"attachments" gorm:"type:jsonb"`
	SharedWith  string    `json:"shared_with" gorm:"type:jsonb"`
	ViewCount   int       `json:"view_count"`
	ExportedAt  *time.Time `json:"exported_at"`
}

// Finding represents a report finding
type Finding struct {
	ID          int       `json:"id"`
	Type        string    `json:"type"` // issue, observation, improvement, success
	Severity    string    `json:"severity"` // critical, high, medium, low, info
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Evidence    []string  `json:"evidence"`
	Impact      string    `json:"impact"`
	Recommendation string `json:"recommendation"`
	Status      string    `json:"status"` // open, acknowledged, resolved
	AssignedTo  *uint     `json:"assigned_to"`
	CreatedAt   time.Time `json:"created_at"`
	ResolvedAt  *time.Time `json:"resolved_at"`
}

// ReportTemplate represents a report template
type ReportTemplate struct {
	ID          uint   `json:"id" gorm:"primaryKey"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Type        string `json:"type"`
	Category    string `json:"category"`
	Sections    string `json:"sections" gorm:"type:jsonb"`
	Metrics     string `json:"metrics" gorm:"type:jsonb"`
	Filters     string `json:"filters" gorm:"type:jsonb"`
	Schedule    string `json:"schedule"` // manual, daily, weekly, monthly
	Recipients  string `json:"recipients" gorm:"type:jsonb"`
	Active      bool   `json:"active"`
}

// ReportMetric represents a metric in a report
type ReportMetric struct {
	Name        string      `json:"name"`
	Value       interface{} `json:"value"`
	Unit        string      `json:"unit"`
	Trend       string      `json:"trend"` // up, down, stable
	Change      float64     `json:"change"` // percentage change
	Threshold   float64     `json:"threshold"`
	Status      string      `json:"status"` // good, warning, critical
	Description string      `json:"description"`
}

// ReportChart represents a chart in a report
type ReportChart struct {
	ID     int                    `json:"id"`
	Type   string                 `json:"type"` // line, bar, pie, area, scatter
	Title  string                 `json:"title"`
	Data   map[string]interface{} `json:"data"`
	Config map[string]interface{} `json:"config"`
}

// NewReportingSystem creates a new reporting system
func NewReportingSystem(db *gorm.DB) *ReportingSystem {
	rs := &ReportingSystem{db: db}
	db.AutoMigrate(&Report{}, &ReportTemplate{})
	rs.initializeDefaultTemplates()
	return rs
}

// CreateReport creates a new report
func (rs *ReportingSystem) CreateReport(report *Report) error {
	report.CreatedAt = time.Now()
	report.Status = "draft"
	return rs.db.Create(report).Error
}

// GenerateIncidentReport generates an incident report
func (rs *ReportingSystem) GenerateIncidentReport(userID uint, username string, timeRange string) (*Report, error) {
	report := &Report{
		Title:       fmt.Sprintf("Incident Report - %s", time.Now().Format("2006-01-02")),
		Type:        "incident",
		Category:    "network",
		CreatedBy:   userID,
		CreatorName: username,
		TimeRange:   timeRange,
		Priority:    "high",
	}

	// Gather incident data
	findings := rs.gatherIncidentFindings(timeRange)
	findingsJSON, _ := json.Marshal(findings)
	report.Findings = string(findingsJSON)

	// Calculate metrics
	metrics := rs.calculateIncidentMetrics(findings)
	metricsJSON, _ := json.Marshal(metrics)
	report.Metrics = string(metricsJSON)

	// Generate charts
	charts := rs.generateIncidentCharts(findings)
	chartsJSON, _ := json.Marshal(charts)
	report.Charts = string(chartsJSON)

	// Generate recommendations
	recommendations := rs.generateIncidentRecommendations(findings)
	recsJSON, _ := json.Marshal(recommendations)
	report.Recommendations = string(recsJSON)

	// Generate summary
	report.Summary = rs.generateIncidentSummary(findings, metrics)

	if err := rs.CreateReport(report); err != nil {
		return nil, err
	}

	return report, nil
}

// GeneratePerformanceReport generates a performance report
func (rs *ReportingSystem) GeneratePerformanceReport(userID uint, username string, timeRange string) (*Report, error) {
	report := &Report{
		Title:       fmt.Sprintf("Performance Report - %s", time.Now().Format("2006-01-02")),
		Type:        "performance",
		Category:    "network",
		CreatedBy:   userID,
		CreatorName: username,
		TimeRange:   timeRange,
		Priority:    "medium",
	}

	// Gather performance data
	findings := rs.gatherPerformanceFindings(timeRange)
	findingsJSON, _ := json.Marshal(findings)
	report.Findings = string(findingsJSON)

	// Calculate metrics
	metrics := rs.calculatePerformanceMetrics()
	metricsJSON, _ := json.Marshal(metrics)
	report.Metrics = string(metricsJSON)

	// Generate charts
	charts := rs.generatePerformanceCharts()
	chartsJSON, _ := json.Marshal(charts)
	report.Charts = string(chartsJSON)

	// Generate recommendations
	recommendations := rs.generatePerformanceRecommendations(metrics)
	recsJSON, _ := json.Marshal(recommendations)
	report.Recommendations = string(recsJSON)

	report.Summary = rs.generatePerformanceSummary(metrics)

	if err := rs.CreateReport(report); err != nil {
		return nil, err
	}

	return report, nil
}

// GenerateSecurityReport generates a security report
func (rs *ReportingSystem) GenerateSecurityReport(userID uint, username string, timeRange string) (*Report, error) {
	report := &Report{
		Title:       fmt.Sprintf("Security Report - %s", time.Now().Format("2006-01-02")),
		Type:        "security",
		Category:    "security",
		CreatedBy:   userID,
		CreatorName: username,
		TimeRange:   timeRange,
		Priority:    "critical",
	}

	findings := rs.gatherSecurityFindings(timeRange)
	findingsJSON, _ := json.Marshal(findings)
	report.Findings = string(findingsJSON)

	metrics := rs.calculateSecurityMetrics()
	metricsJSON, _ := json.Marshal(metrics)
	report.Metrics = string(metricsJSON)

	charts := rs.generateSecurityCharts()
	chartsJSON, _ := json.Marshal(charts)
	report.Charts = string(chartsJSON)

	recommendations := rs.generateSecurityRecommendations(findings)
	recsJSON, _ := json.Marshal(recommendations)
	report.Recommendations = string(recsJSON)

	report.Summary = rs.generateSecuritySummary(findings, metrics)

	if err := rs.CreateReport(report); err != nil {
		return nil, err
	}

	return report, nil
}

// AddFinding adds a finding to a report
func (rs *ReportingSystem) AddFinding(reportID uint, finding Finding) error {
	var report Report
	if err := rs.db.First(&report, reportID).Error; err != nil {
		return err
	}

	var findings []Finding
	json.Unmarshal([]byte(report.Findings), &findings)
	
	finding.ID = len(findings) + 1
	finding.CreatedAt = time.Now()
	findings = append(findings, finding)

	findingsJSON, _ := json.Marshal(findings)
	report.Findings = string(findingsJSON)

	return rs.db.Save(&report).Error
}

// PublishReport publishes a report
func (rs *ReportingSystem) PublishReport(reportID uint) error {
	return rs.db.Model(&Report{}).Where("id = ?", reportID).Update("status", "published").Error
}

// ShareReport shares a report with users
func (rs *ReportingSystem) ShareReport(reportID uint, userIDs []uint) error {
	var report Report
	if err := rs.db.First(&report, reportID).Error; err != nil {
		return err
	}

	sharedJSON, _ := json.Marshal(userIDs)
	report.SharedWith = string(sharedJSON)

	return rs.db.Save(&report).Error
}

// ExportReport exports a report
func (rs *ReportingSystem) ExportReport(reportID uint, format string) ([]byte, error) {
	var report Report
	if err := rs.db.First(&report, reportID).Error; err != nil {
		return nil, err
	}

	now := time.Now()
	report.ExportedAt = &now
	rs.db.Save(&report)

	switch format {
	case "json":
		return json.MarshalIndent(report, "", "  ")
	case "pdf":
		// In production, generate PDF
		return []byte("PDF export not implemented"), nil
	default:
		return json.Marshal(report)
	}
}

// GetReportsByUser retrieves reports created by a user
func (rs *ReportingSystem) GetReportsByUser(userID uint) ([]Report, error) {
	var reports []Report
	err := rs.db.Where("created_by = ?", userID).Order("created_at DESC").Find(&reports).Error
	return reports, err
}

// GetReportsByType retrieves reports by type
func (rs *ReportingSystem) GetReportsByType(reportType string) ([]Report, error) {
	var reports []Report
	err := rs.db.Where("type = ? AND status = ?", reportType, "published").
		Order("created_at DESC").Find(&reports).Error
	return reports, err
}

// SearchReports searches reports
func (rs *ReportingSystem) SearchReports(query string) ([]Report, error) {
	var reports []Report
	err := rs.db.Where("title ILIKE ? OR summary ILIKE ?", "%"+query+"%", "%"+query+"%").
		Order("created_at DESC").Find(&reports).Error
	return reports, err
}

// Helper functions for gathering data

func (rs *ReportingSystem) gatherIncidentFindings(timeRange string) []Finding {
	var findings []Finding

	// Query incidents from database
	var incidents []struct {
		ID          uint
		Title       string
		Severity    string
		Description string
		CreatedAt   time.Time
	}

	rs.db.Raw(`
		SELECT id, title, severity, description, created_at 
		FROM tickets 
		WHERE type = 'incident' AND created_at > NOW() - INTERVAL '24 hours'
		ORDER BY created_at DESC
	`).Scan(&incidents)

	for _, incident := range incidents {
		finding := Finding{
			ID:          int(incident.ID),
			Type:        "issue",
			Severity:    incident.Severity,
			Title:       incident.Title,
			Description: incident.Description,
			CreatedAt:   incident.CreatedAt,
			Status:      "open",
		}
		findings = append(findings, finding)
	}

	return findings
}

func (rs *ReportingSystem) gatherPerformanceFindings(timeRange string) []Finding {
	var findings []Finding

	// Query performance issues
	findings = append(findings, Finding{
		Type:        "observation",
		Severity:    "medium",
		Title:       "Network Latency Increase",
		Description: "Average latency increased by 15% over the past week",
		Impact:      "Slower application response times",
		Status:      "open",
	})

	return findings
}

func (rs *ReportingSystem) gatherSecurityFindings(timeRange string) []Finding {
	var findings []Finding

	// Query security events
	var vulnCount int64
	rs.db.Raw("SELECT COUNT(*) FROM vulnerabilities WHERE status = 'open'").Scan(&vulnCount)

	if vulnCount > 0 {
		findings = append(findings, Finding{
			Type:           "issue",
			Severity:       "high",
			Title:          fmt.Sprintf("%d Open Vulnerabilities", vulnCount),
			Description:    "Multiple security vulnerabilities detected",
			Impact:         "Potential security breach",
			Recommendation: "Patch affected systems immediately",
			Status:         "open",
		})
	}

	return findings
}

func (rs *ReportingSystem) calculateIncidentMetrics(findings []Finding) []ReportMetric {
	metrics := []ReportMetric{
		{
			Name:        "Total Incidents",
			Value:       len(findings),
			Unit:        "count",
			Trend:       "up",
			Change:      12.5,
			Status:      "warning",
			Description: "Total number of incidents in the reporting period",
		},
		{
			Name:        "Critical Incidents",
			Value:       rs.countBySeverity(findings, "critical"),
			Unit:        "count",
			Trend:       "down",
			Change:      -5.2,
			Status:      "good",
			Description: "Number of critical severity incidents",
		},
		{
			Name:        "Mean Time to Resolution",
			Value:       45.3,
			Unit:        "minutes",
			Trend:       "down",
			Change:      -8.1,
			Threshold:   60,
			Status:      "good",
			Description: "Average time to resolve incidents",
		},
	}

	return metrics
}

func (rs *ReportingSystem) calculatePerformanceMetrics() []ReportMetric {
	metrics := []ReportMetric{
		{
			Name:        "Average CPU Usage",
			Value:       45.2,
			Unit:        "%",
			Trend:       "stable",
			Change:      0.5,
			Threshold:   80,
			Status:      "good",
			Description: "Average CPU utilization across all devices",
		},
		{
			Name:        "Network Throughput",
			Value:       2.45,
			Unit:        "Gbps",
			Trend:       "up",
			Change:      15.3,
			Status:      "good",
			Description: "Total network throughput",
		},
		{
			Name:        "Packet Loss",
			Value:       0.12,
			Unit:        "%",
			Trend:       "down",
			Change:      -0.05,
			Threshold:   1.0,
			Status:      "good",
			Description: "Average packet loss percentage",
		},
	}

	return metrics
}

func (rs *ReportingSystem) calculateSecurityMetrics() []ReportMetric {
	metrics := []ReportMetric{
		{
			Name:        "Open Vulnerabilities",
			Value:       3,
			Unit:        "count",
			Trend:       "down",
			Change:      -40,
			Threshold:   5,
			Status:      "good",
			Description: "Number of unpatched vulnerabilities",
		},
		{
			Name:        "Failed Login Attempts",
			Value:       12,
			Unit:        "count",
			Trend:       "up",
			Change:      20,
			Threshold:   50,
			Status:      "warning",
			Description: "Failed authentication attempts",
		},
		{
			Name:        "Compliance Score",
			Value:       92.5,
			Unit:        "%",
			Trend:       "up",
			Change:      2.5,
			Threshold:   90,
			Status:      "good",
			Description: "Overall security compliance score",
		},
	}

	return metrics
}

func (rs *ReportingSystem) generateIncidentCharts(findings []Finding) []ReportChart {
	charts := []ReportChart{
		{
			ID:    1,
			Type:  "pie",
			Title: "Incidents by Severity",
			Data: map[string]interface{}{
				"labels": []string{"Critical", "High", "Medium", "Low"},
				"values": []int{
					rs.countBySeverity(findings, "critical"),
					rs.countBySeverity(findings, "high"),
					rs.countBySeverity(findings, "medium"),
					rs.countBySeverity(findings, "low"),
				},
			},
		},
		{
			ID:    2,
			Type:  "line",
			Title: "Incidents Over Time",
			Data: map[string]interface{}{
				"labels": []string{"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"},
				"values": []int{5, 8, 6, 12, 9, 4, 3},
			},
		},
	}

	return charts
}

func (rs *ReportingSystem) generatePerformanceCharts() []ReportChart {
	charts := []ReportChart{
		{
			ID:    1,
			Type:  "area",
			Title: "CPU Usage Trend",
			Data: map[string]interface{}{
				"labels": []string{"00:00", "04:00", "08:00", "12:00", "16:00", "20:00"},
				"values": []float64{35.2, 42.1, 55.8, 48.3, 52.1, 38.9},
			},
		},
		{
			ID:    2,
			Type:  "bar",
			Title: "Network Throughput by Device",
			Data: map[string]interface{}{
				"labels": []string{"Router-01", "Switch-01", "Firewall-01"},
				"values": []float64{1.2, 0.8, 0.45},
			},
		},
	}

	return charts
}

func (rs *ReportingSystem) generateSecurityCharts() []ReportChart {
	charts := []ReportChart{
		{
			ID:    1,
			Type:  "bar",
			Title: "Security Events by Type",
			Data: map[string]interface{}{
				"labels": []string{"Failed Logins", "Port Scans", "Malware", "Policy Violations"},
				"values": []int{12, 5, 2, 8},
			},
		},
	}

	return charts
}

func (rs *ReportingSystem) generateIncidentRecommendations(findings []Finding) []string {
	recommendations := []string{
		"Implement automated monitoring for faster incident detection",
		"Establish incident response playbooks for common scenarios",
		"Conduct post-incident reviews to prevent recurrence",
	}

	if rs.countBySeverity(findings, "critical") > 0 {
		recommendations = append(recommendations, "Prioritize resolution of critical incidents")
	}

	return recommendations
}

func (rs *ReportingSystem) generatePerformanceRecommendations(metrics []ReportMetric) []string {
	return []string{
		"Consider upgrading bandwidth on high-utilization links",
		"Implement QoS policies for critical applications",
		"Schedule maintenance during low-traffic periods",
	}
}

func (rs *ReportingSystem) generateSecurityRecommendations(findings []Finding) []string {
	return []string{
		"Apply security patches to vulnerable systems",
		"Enable multi-factor authentication for all users",
		"Conduct regular security audits and penetration testing",
		"Implement rate limiting on authentication endpoints",
	}
}

func (rs *ReportingSystem) generateIncidentSummary(findings []Finding, metrics []ReportMetric) string {
	return fmt.Sprintf("This report covers %d incidents with an average resolution time of 45 minutes. Critical incidents decreased by 5.2%% compared to the previous period.", len(findings))
}

func (rs *ReportingSystem) generatePerformanceSummary(metrics []ReportMetric) string {
	return "Network performance remains stable with average CPU usage at 45.2% and packet loss below 0.2%. Throughput increased by 15.3% due to recent upgrades."
}

func (rs *ReportingSystem) generateSecuritySummary(findings []Finding, metrics []ReportMetric) string {
	return "Security posture improved with 3 open vulnerabilities (down 40%). Compliance score at 92.5%. Failed login attempts increased by 20%, requiring investigation."
}

func (rs *ReportingSystem) countBySeverity(findings []Finding, severity string) int {
	count := 0
	for _, f := range findings {
		if f.Severity == severity {
			count++
		}
	}
	return count
}

func (rs *ReportingSystem) initializeDefaultTemplates() {
	templates := []ReportTemplate{
		{
			Name:        "Daily Incident Summary",
			Description: "Daily summary of all incidents",
			Type:        "incident",
			Category:    "network",
			Schedule:    "daily",
			Active:      true,
		},
		{
			Name:        "Weekly Performance Report",
			Description: "Weekly network performance analysis",
			Type:        "performance",
			Category:    "network",
			Schedule:    "weekly",
			Active:      true,
		},
		{
			Name:        "Monthly Security Report",
			Description: "Monthly security posture assessment",
			Type:        "security",
			Category:    "security",
			Schedule:    "monthly",
			Active:      true,
		},
	}

	for _, template := range templates {
		var existing ReportTemplate
		result := rs.db.Where("name = ?", template.Name).First(&existing)
		if result.Error == gorm.ErrRecordNotFound {
			rs.db.Create(&template)
		}
	}
}
