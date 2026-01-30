package handlers

import (
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"networking-main/internal/middleware"
	models "networking-main/internal/models"
	"networking-main/internal/proxy"
	"networking-main/pkg/admin"
	"networking-main/pkg/aiops"
	"networking-main/pkg/auth"
	"networking-main/pkg/billing"
	"networking-main/pkg/collaboration"
	"networking-main/pkg/daraja"
	"networking-main/pkg/discovery"
	"networking-main/pkg/domain"
	"networking-main/pkg/finance"
	"networking-main/pkg/fup"
	"networking-main/pkg/health"
	"networking-main/pkg/inventory"
	"networking-main/pkg/ipam"
	"networking-main/pkg/migration"
	"networking-main/pkg/netconfig"
	"networking-main/pkg/netflow"
	"networking-main/pkg/neural"
	"networking-main/pkg/nexus"
	"networking-main/pkg/onboarding"
	"networking-main/pkg/probes"
	"networking-main/pkg/provisioning"
	"networking-main/pkg/reporting"
	"networking-main/pkg/scheduler"
	"networking-main/pkg/sdwan"
	"networking-main/pkg/simulation"
	"networking-main/pkg/sniffer"
	"networking-main/pkg/snmp"
	"networking-main/pkg/staff"
	"networking-main/pkg/telemetry"
	"networking-main/pkg/topology"
	"networking-main/pkg/webhooks"
	"networking-main/pkg/wireless"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/skip2/go-qrcode"
	"gorm.io/gorm"
)

// APIHandlers contains all API handlers
type APIHandlers struct {
	DB               *gorm.DB // Exported
	authService      *auth.Service
	discoveryService *discovery.Service
	inventoryService *inventory.Service
	configService    *netconfig.Service
	telemetryService *telemetry.Service
	adminService     *admin.Service
	rbac             *auth.RBACManager
	healthEngine     *health.HealthAnalysisEngine
	onboarding       *onboarding.OnboardingSystem
	reporting        *reporting.ReportingSystem
	staffTracking    *staff.StaffTrackingSystem
	topologyAnalyzer *topology.AdvancedTopologyAnalyzer
	darajaClient     *daraja.Client
	ipamService      *ipam.Service
	billingService   *billing.Service
	fupService       *fup.Service
	provisioning     *provisioning.Service
	deviceProxy      *proxy.DeviceProxy
	webhookService   *webhooks.Service
	probeService     *probes.Service
	aiopsService     *aiops.Service
	snifferService   *sniffer.Service
	migrationService *migration.Service
	FinanceService   *finance.Service
	chatHub          *collaboration.ChatHub
	ticketingSystem  *collaboration.TicketingSystem
	RateLimiter      *middleware.RateLimiter
	Compliance       *netconfig.ComplianceManager
	QoSVisualizer    *telemetry.QoSVisualizer
	CapacityPlanner  *aiops.CapacityPlanner
	Simulation       *simulation.Service
	SDWAN            *sdwan.Service
	Wireless         *wireless.Controller
	SNMP             *snmp.Service
	NetFlow          *netflow.Collector
	Scheduler        *scheduler.Service
	Neural           *neural.Service
	Domain           *domain.Service
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all for demo
	},
}

// NewAPIHandlers creates new API handlers
func NewAPIHandlers(
	db *gorm.DB,
	authService *auth.Service,
	discoveryService *discovery.Service,
	inventoryService *inventory.Service,
	configService *netconfig.Service,
	telemetryService *telemetry.Service,
	adminService *admin.Service,
	healthEngine *health.HealthAnalysisEngine,
	onboarding *onboarding.OnboardingSystem,
	topologyAnalyzer *topology.AdvancedTopologyAnalyzer,
	reporting *reporting.ReportingSystem,
	staffTracking *staff.StaffTrackingSystem,
	rbac *auth.RBACManager,
	darajaConfig daraja.Config,
	ipamService *ipam.Service,
	billingService *billing.Service,
	fupService *fup.Service,
	provisioningService *provisioning.Service,
	webhookService *webhooks.Service,
	probeService *probes.Service,
	aiopsService *aiops.Service,
	migrationService *migration.Service,
	financeService *finance.Service,
	chatHub *collaboration.ChatHub,
	ticketingSystem *collaboration.TicketingSystem,
	rateLimiter *middleware.RateLimiter,
	sdwanService *sdwan.Service,
	wirelessController *wireless.Controller,
	snmpService *snmp.Service,
	netflowService *netflow.Collector,
	schedulerService *scheduler.Service,
	neuralService *neural.Service,
	domainService *domain.Service,
) *APIHandlers {
	return &APIHandlers{
		DB:               db,
		authService:      authService,
		discoveryService: discoveryService,
		inventoryService: inventoryService,
		configService:    configService,
		telemetryService: telemetryService,
		adminService:     adminService,
		rbac:             rbac,
		healthEngine:     healthEngine,
		onboarding:       onboarding,
		reporting:        reporting,
		staffTracking:    staffTracking,
		topologyAnalyzer: topologyAnalyzer,
		darajaClient:     daraja.NewClient(darajaConfig),
		ipamService:      ipamService,
		billingService:   billingService,
		fupService:       fupService,
		provisioning:     provisioningService,
		deviceProxy:      proxy.NewDeviceProxy(),
		webhookService:   webhookService,
		probeService:     probeService,
		aiopsService:     aiopsService,
		snifferService:   sniffer.NewService(),
		migrationService: migrationService,
		FinanceService:   financeService,
		chatHub:          chatHub,
		ticketingSystem:  ticketingSystem,
		RateLimiter:      rateLimiter,
		Compliance:       configService.ComplianceManager,
		QoSVisualizer:    telemetryService.QoSVisualizer,
		CapacityPlanner:  aiopsService.CapacityPlanner,
		Simulation:       simulation.NewService(db),
		SDWAN:            sdwanService,
		Wireless:         wirelessController,
		SNMP:             snmpService,
		NetFlow:          netflowService,
		Scheduler:        schedulerService,
		Neural:           neuralService,
		Domain:           domainService,
	}
}

// Middleware for RBAC
func (h *APIHandlers) RBACMiddleware(resource, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetUint("user_id")
		username := c.GetString("username")

		if !h.rbac.HasPermission(userID, resource, action) {
			h.rbac.LogAccess(userID, username, action, resource, 0, c.ClientIP(), c.Request.UserAgent(), false, "Permission denied")
			c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
			c.Abort()
			return
		}

		c.Next()

		h.rbac.LogAccess(userID, username, action, resource, 0, c.ClientIP(), c.Request.UserAgent(), true, "")
	}
}

// JWTMiddleware proxies to AuthService
func (h *APIHandlers) JWTMiddleware() gin.HandlerFunc {
	return h.authService.JWTAuthMiddleware()
}

// ApplyIntent handles intent-based networking requests
func (h *APIHandlers) ApplyIntent(c *gin.Context) {
	var intent netconfig.NetworkIntent
	if err := c.ShouldBindJSON(&intent); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	results, err := h.configService.ApplyNetworkIntent(c.Request.Context(), intent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Intent applied successfully",
		"intent":  intent.Type,
		"results": results,
	})
}

// ProxyToDevice handles secure tunneling to a managed device
func (h *APIHandlers) ProxyToDevice(c *gin.Context) {
	deviceIDStr := c.Param("did")
	deviceID, err := strconv.ParseUint(deviceIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	// 1. Fetch device to get IP
	var device models.Device
	if err := h.DB.First(&device, uint(deviceID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	// 2. Determine target port (default 80 for web UI, could be dynamic per device type)
	targetPort := 80
	if device.DeviceType == "mikrotik" {
		targetPort = 80 // or 8728 for API, but here we proxy web UI
	}

	// 3. Delegate to proxy service
	h.deviceProxy.ProxyToDevice(c, device.IPAddress, targetPort)
}

// ============ Health API Handlers ============

// ============ Health API Handlers ============

// ============ Auth API Handlers ============

func (h *APIHandlers) Login(c *gin.Context) {
	h.authService.Login(c)
}

func (h *APIHandlers) Logout(c *gin.Context) {
	h.authService.Logout(c)
}

func (h *APIHandlers) Register(c *gin.Context) {
	h.authService.Register(c)
}

func (h *APIHandlers) ForgotPassword(c *gin.Context) {
	h.authService.ForgotPassword(c)
}

func (h *APIHandlers) ResetPassword(c *gin.Context) {
	h.authService.ResetPassword(c)
}

func (h *APIHandlers) GetCurrentUser(c *gin.Context) {
	h.authService.GetCurrentUser(c)
}

func (h *APIHandlers) GetLatestHealthAnalysis(c *gin.Context) {
	analysis, err := h.healthEngine.GetLatestAnalysis()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Return empty healthy status if no analysis exists yet
			c.JSON(http.StatusOK, health.HealthAnalysis{
				OverallStatus:  health.HealthStatusHealthy,
				Timestamp:      time.Now(),
				Issues:         "[]",
				SystemHealth:   &health.SystemHealthMetrics{},
				NetworkHealth:  &health.NetworkHealthMetrics{},
				SecurityHealth: &health.SecurityHealthMetrics{},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analysis)
}

func (h *APIHandlers) RunHealthAnalysis(c *gin.Context) {
	analysis, err := h.healthEngine.PerformComprehensiveAnalysis()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analysis)
}

func (h *APIHandlers) GetHealthIssues(c *gin.Context) {
	analysisID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	issues, err := h.healthEngine.GetIssuesByAnalysis(uint(analysisID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, issues)
}

func (h *APIHandlers) GetQuickFixes(c *gin.Context) {
	issueID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	fixes, err := h.healthEngine.GetQuickFixesByIssue(uint(issueID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, fixes)
}

func (h *APIHandlers) ApplyQuickFix(c *gin.Context) {
	fixID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	err := h.healthEngine.ApplyQuickFix(uint(fixID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Quick fix applied successfully"})
}

// InitiateBoost handles requests for temporary speed upgrades
func (h *APIHandlers) InitiateBoost(c *gin.Context) {
	var req struct {
		UserID    uint `json:"user_id" binding:"required"`
		DeviceID  uint `json:"device_id" binding:"required"`
		PackageID uint `json:"package_id" binding:"required"`
		Hours     int  `json:"hours" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	duration := time.Duration(req.Hours) * time.Hour
	err := h.provisioning.ScheduleBoost(c, req.UserID, req.DeviceID, req.PackageID, duration)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Turbo Boost activated! 🚀",
		"expires_at": time.Now().Add(duration),
	})
}

func (h *APIHandlers) SetPriority(c *gin.Context) {
	var req struct {
		UserID   uint   `json:"user_id" binding:"required"`
		DeviceID uint   `json:"device_id" binding:"required"`
		Category string `json:"category" binding:"required"` // "gaming", "streaming"
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.provisioning.SetL7Priority(c, req.UserID, req.DeviceID, req.Category); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Priority set"})
}

// GetAnomalies returns AI-detected telemetry anomalies
func (h *APIHandlers) GetAnomalies(c *gin.Context) {
	deviceIDStr := c.Query("did")
	metric := c.DefaultQuery("metric", "latency")
	deviceID, _ := strconv.ParseUint(deviceIDStr, 10, 32)

	anomalies, err := h.aiopsService.DetectAnomalies(c, uint(deviceID), metric)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, anomalies)
}

// PredictChurn returns the risk score of a user leaving
func (h *APIHandlers) PredictChurn(c *gin.Context) {
	userIDStr := c.Param("uid")
	userID, _ := strconv.ParseUint(userIDStr, 10, 32)

	score, reason, err := h.aiopsService.PredictChurn(c, uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":        userID,
		"risk_score":     score,
		"risk_level":     reason,
		"recommendation": "Offer a dynamic QoS Boost to improve experience 🛸",
	})
}

// GetVoucherQR generates a WiFi login QR code for a voucher
func (h *APIHandlers) GetVoucherQR(c *gin.Context) {
	code := c.Param("code")
	var voucher models.Voucher
	if err := h.DB.Where("code = ?", code).First(&voucher).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Voucher not found"})
		return
	}

	// Format: WIFI:S:<SSID>;T:<WPA|WEP|nopass>;P:<password>;H:<true|false|empty>;;
	// For Voucher, we might just put the code in the password field or a specialized URL
	qrData := fmt.Sprintf("WIFI:S:Alien-Network;T:WPA;P:%s;;", voucher.Code)

	// Generate real QR code
	var png []byte
	png, err := qrcode.Encode(qrData, qrcode.Medium, 256)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate QR code"})
		return
	}

	qrBase64 := base64.StdEncoding.EncodeToString(png)

	c.JSON(http.StatusOK, gin.H{
		"code":    voucher.Code,
		"qr_data": qrData,
		"image":   "data:image/png;base64," + qrBase64,
		"tip":     "Scan to connect to the intergalactic network 🛰️",
	})
}

// HandleBotWebhook processes incoming messages from admin bots (Telegram/WhatsApp)
func (h *APIHandlers) HandleBotWebhook(c *gin.Context) {
	var payload map[string]interface{}
	if err := c.BindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	// 👽 Alien Bot Command Logic Simulation
	// Simplified: Look for a "text" or "message" field
	// 👽 Alien Bot Command Logic
	msg := fmt.Sprint(payload["text"])
	switch msg {
	case "/status":
		c.JSON(http.StatusOK, gin.H{"response": "All systems operational. Network Pulse: 100% 🖖"})
	case "/alerts":
		var alerts []models.NetworkAlert
		h.DB.Where("resolved = ?", false).Limit(5).Find(&alerts)
		c.JSON(http.StatusOK, gin.H{"response": "Active Alerts:", "alerts": alerts})
	case "/clients":
		var count int64
		h.DB.Model(&models.User{}).Count(&count)
		c.JSON(http.StatusOK, gin.H{"response": fmt.Sprintf("Intergalactic Citizens Online: %d 🛰️", count)})
	default:
		c.JSON(http.StatusOK, gin.H{"message": "Webhook received", "status": "processed"})
	}
}

// SniffTraffic streams live packets via WebSocket from the server interface
func (h *APIHandlers) SniffTraffic(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Println("Failed to upgrade WebSocket:", err)
		return
	}
	defer conn.Close()

	// Default to eth0 or similar for Linux; on Windows loopback adapter might be needed
	iface := c.DefaultQuery("iface", "\\Device\\NPF_Loopback") // Specific for Windows

	err = h.snifferService.StartCapture(c.Request.Context(), iface, conn)
	if err != nil {
		fmt.Println("Sniffer error:", err)
	}
}

// ============ Onboarding API Handlers ============

func (h *APIHandlers) GetOnboardingStatus(c *gin.Context) {
	userID := c.GetUint("user_id")
	status, err := h.onboarding.GetUserOnboarding(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, status)
}

func (h *APIHandlers) GetOnboardingTours(c *gin.Context) {
	tours, err := h.onboarding.GetAllTours()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tours)
}

func (h *APIHandlers) CompleteOnboardingStep(c *gin.Context) {
	userID := c.GetUint("user_id")
	stepID, _ := strconv.Atoi(c.Param("id"))
	err := h.onboarding.CompleteStep(userID, stepID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Step completed"})
}

func (h *APIHandlers) SkipOnboardingStep(c *gin.Context) {
	userID := c.GetUint("user_id")
	stepID, _ := strconv.Atoi(c.Param("id"))
	err := h.onboarding.SkipStep(userID, stepID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Step skipped"})
}

// ============ Topology API Handlers ============

func (h *APIHandlers) GetLatestTopologyAnalysis(c *gin.Context) {
	analysis, err := h.topologyAnalyzer.GetLatestAnalysis()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusOK, gin.H{"status": "no_analysis_found", "message": "Neural cores haven't processed recent topology data"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analysis)
}

func (h *APIHandlers) RunTopologyAnalysis(c *gin.Context) {
	analysis, err := h.topologyAnalyzer.PerformComprehensiveAnalysis()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analysis)
}

func (h *APIHandlers) ExportTopologyData(c *gin.Context) {
	data, err := h.topologyAnalyzer.ExportTopologyData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// ============ Reporting API Handlers ============

func (h *APIHandlers) GetReports(c *gin.Context) {
	userID := c.GetUint("user_id")
	reports, err := h.reporting.GetReportsByUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reports)
}

func (h *APIHandlers) GetReportsByType(c *gin.Context) {
	reportType := c.Param("type")
	reports, err := h.reporting.GetReportsByType(reportType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reports)
}

func (h *APIHandlers) GenerateIncidentReport(c *gin.Context) {
	userID := c.GetUint("user_id")
	username := c.GetString("username")

	var req struct {
		TimeRange string `json:"time_range"`
	}
	c.BindJSON(&req)

	report, err := h.reporting.GenerateIncidentReport(userID, username, req.TimeRange)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, report)
}

func (h *APIHandlers) GeneratePerformanceReport(c *gin.Context) {
	userID := c.GetUint("user_id")
	username := c.GetString("username")

	var req struct {
		TimeRange string `json:"time_range"`
	}
	c.BindJSON(&req)

	report, err := h.reporting.GeneratePerformanceReport(userID, username, req.TimeRange)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, report)
}

func (h *APIHandlers) GenerateSecurityReport(c *gin.Context) {
	userID := c.GetUint("user_id")
	username := c.GetString("username")

	var req struct {
		TimeRange string `json:"time_range"`
	}
	c.BindJSON(&req)

	report, err := h.reporting.GenerateSecurityReport(userID, username, req.TimeRange)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, report)
}

func (h *APIHandlers) ExportReport(c *gin.Context) {
	reportID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	format := c.DefaultQuery("format", "json")

	data, err := h.reporting.ExportReport(uint(reportID), format)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if format == "pdf" {
		c.Data(http.StatusOK, "application/pdf", data)
	} else {
		c.Data(http.StatusOK, "application/json", data)
	}
}

// ============ Staff Tracking API Handlers ============

func (h *APIHandlers) CheckIn(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		Location string `json:"location"`
	}
	c.BindJSON(&req)

	attendance, err := h.staffTracking.CheckIn(userID, req.Location, c.ClientIP())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, attendance)
}

func (h *APIHandlers) CheckOut(c *gin.Context) {
	userID := c.GetUint("user_id")
	err := h.staffTracking.CheckOut(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Checked out successfully"})
}

func (h *APIHandlers) LogWork(c *gin.Context) {
	userID := c.GetUint("user_id")

	var log staff.WorkLog
	if err := c.BindJSON(&log); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.StaffID = userID
	err := h.staffTracking.LogWork(&log)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, log)
}

func (h *APIHandlers) CompleteWorkLog(c *gin.Context) {
	logID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req struct {
		Notes string `json:"notes"`
	}
	c.BindJSON(&req)

	err := h.staffTracking.CompleteWorkLog(uint(logID), req.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Work log completed"})
}

func (h *APIHandlers) RequestLeave(c *gin.Context) {
	userID := c.GetUint("user_id")

	var request staff.LeaveRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	request.StaffID = userID
	err := h.staffTracking.RequestLeave(&request)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, request)
}

func (h *APIHandlers) ApproveLeave(c *gin.Context) {
	requestID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	approverID := c.GetUint("user_id")

	var req struct {
		Comments string `json:"comments"`
	}
	c.BindJSON(&req)

	err := h.staffTracking.ApproveLeave(uint(requestID), approverID, req.Comments)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Leave approved"})
}

func (h *APIHandlers) GetAttendanceReport(c *gin.Context) {
	staffID := c.GetUint("user_id")
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))

	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -days)

	report, err := h.staffTracking.GetAttendanceReport(staffID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, report)
}

func (h *APIHandlers) GetWorkLogReport(c *gin.Context) {
	staffID := c.GetUint("user_id")
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))

	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -days)

	report, err := h.staffTracking.GetWorkLogReport(staffID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, report)
}

func (h *APIHandlers) GetTodayAttendance(c *gin.Context) {
	attendance, err := h.staffTracking.GetTodayAttendance()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, attendance)
}

// ============ RBAC API Handlers ============

func (h *APIHandlers) GetUserRoles(c *gin.Context) {
	userID := c.GetUint("user_id")
	roles, err := h.rbac.GetUserRoles(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, roles)
}

func (h *APIHandlers) GetAuditLogs(c *gin.Context) {
	var userID *uint
	if id := c.Query("user_id"); id != "" {
		uid, _ := strconv.ParseUint(id, 10, 32)
		u := uint(uid)
		userID = &u
	}

	resource := c.Query("resource")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))

	logs, err := h.rbac.GetAuditLogs(userID, resource, time.Time{}, time.Time{}, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, logs)
}

func (h *APIHandlers) GetUserActivity(c *gin.Context) {
	userID := c.GetUint("user_id")
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))

	activity, err := h.rbac.GetUserActivity(userID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, activity)
}

// ListUsers returns all users for admin management
func (h *APIHandlers) ListUsers(c *gin.Context) {
	var users []models.User
	if err := h.DB.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

// CreateUser handles admin-side user creation
func (h *APIHandlers) CreateUser(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
		Role     string `json:"role"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, _ := h.authService.HashPassword(input.Password)
	user := models.User{
		Username: input.Username,
		Email:    input.Email,
		Password: hashedPassword,
		Role:     input.Role,
	}

	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// DeleteUser removes a user from the system
func (h *APIHandlers) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	if err := h.DB.Delete(&models.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// UpdateUser handles admin-side user updates
func (h *APIHandlers) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Role string `json:"role"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.DB.Model(&models.User{}).Where("id = ?", id).Update("role", input.Role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated successfully"})
}

// ListMerchants returns users with seller-related roles
func (h *APIHandlers) ListMerchants(c *gin.Context) {
	var users []models.User
	// Assuming merchants have roles starting with 'seller' or 'merchant'
	if err := h.DB.Where("role LIKE ? OR role LIKE ?", "%seller%", "%merchant%").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

// VerifyMerchant handles merchant approval
func (h *APIHandlers) VerifyMerchant(c *gin.Context) {
	id := c.Param("id")
	// For now, verification just ensures they have the 'merchant' role or a 'verified' flag if added
	// We'll just update the role to 'merchant' if it was 'pending_merchant'
	if err := h.DB.Model(&models.User{}).Where("id = ?", id).Update("role", "merchant").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Merchant verified successfully"})
}

// DenyMerchant handles merchant rejection
func (h *APIHandlers) DenyMerchant(c *gin.Context) {
	id := c.Param("id")
	// Demote to 'user' if they were pending
	if err := h.DB.Model(&models.User{}).Where("id = ?", id).Update("role", "user").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Merchant request denied, role reset to user"})
}

func (h *APIHandlers) ListRoles(c *gin.Context) {
	roles, err := h.rbac.GetAllRoles()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, roles)
}

func (h *APIHandlers) CreateRole(c *gin.Context) {
	var role auth.Role
	if err := c.ShouldBindJSON(&role); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.rbac.CreateRole(&role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, role)
}

func (h *APIHandlers) UpdateRole(c *gin.Context) {
	var role auth.Role
	if err := c.ShouldBindJSON(&role); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.rbac.UpdateRole(&role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, role)
}

func (h *APIHandlers) DeleteRole(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	if err := h.rbac.DeleteRole(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Role deleted"})
}

func (h *APIHandlers) AssignRole(c *gin.Context) {
	var req struct {
		UserID uint `json:"user_id"`
		RoleID uint `json:"role_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adminID := c.GetUint("user_id")
	if err := h.rbac.AssignRole(req.UserID, req.RoleID, adminID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Role assigned"})
}

func (h *APIHandlers) RemoveRole(c *gin.Context) {
	var req struct {
		UserID uint `json:"user_id"`
		RoleID uint `json:"role_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.rbac.RemoveRole(req.UserID, req.RoleID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Role removed"})
}

// ============ Simulation API Handlers (Handled in simulation_handlers.go) ============

// ============ SD-WAN API Handlers ============

func (h *APIHandlers) RegisterSite(c *gin.Context) {
	var req struct {
		Name      string `json:"name"`
		Location  string `json:"location"`
		LANSubnet string `json:"lan_subnet"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	site, err := h.SDWAN.RegisterSite(req.Name, req.Location, req.LANSubnet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, site)
}

func (h *APIHandlers) GetVPNConfig(c *gin.Context) {
	siteIDStr := c.Param("id")
	siteID, err := strconv.ParseUint(siteIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid site ID"})
		return
	}
	vpnType := c.DefaultQuery("type", "wireguard")

	config, err := h.SDWAN.GenerateVPNConfig(uint(siteID), vpnType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, config)
}

func (h *APIHandlers) HandleZTP(c *gin.Context) {
	var req struct {
		SerialNumber string `json:"serial_number"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config, err := h.SDWAN.HandleZTP(req.SerialNumber)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, config)
}

func (h *APIHandlers) ListSites(c *gin.Context) {
	sites, err := h.SDWAN.ListSites()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sites)
}

// ============ Wireless Controller API Handlers ============

func (h *APIHandlers) GetWirelessInventory(c *gin.Context) {
	inventory, err := h.Wireless.GetInventory()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, inventory)
}

func (h *APIHandlers) ProvisionAP(c *gin.Context) {
	var req struct {
		Name  string `json:"name"`
		MAC   string `json:"mac_address"`
		IP    string `json:"ip_address"`
		Model string `json:"model"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ap, err := h.Wireless.ProvisionAP(req.Name, req.MAC, req.IP, req.Model)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ap)
}

func (h *APIHandlers) CreateSSID(c *gin.Context) {
	var req struct {
		Name     string `json:"name"`
		SSID     string `json:"ssid"`
		Security string `json:"security"`
		VLAN     int    `json:"vlan"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile, err := h.Wireless.CreateSSID(req.Name, req.SSID, req.Security, req.VLAN)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, profile)
}

// ============ NetFlow API Handlers ============

func (h *APIHandlers) GetNetFlowTopTalkers(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	talkers, err := h.NetFlow.GetTopTalkers(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, talkers)
}

// ============ Scheduler API Handlers ============

func (h *APIHandlers) GetScheduledTasks(c *gin.Context) {
	c.JSON(http.StatusOK, h.Scheduler.GetTasks())
}

func (h *APIHandlers) TriggerScheduledTask(c *gin.Context) {
	taskName := c.Param("name")
	if err := h.Scheduler.TriggerTask(taskName); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Task triggered successfully"})
}

func (h *APIHandlers) GetTaskLogs(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	logs, err := h.Scheduler.GetLogs(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, logs)
}

// ============ Nexus API Handlers ============

func (h *APIHandlers) StreamNexusData(c *gin.Context) {
	// Delegate to the package handler
	nexus.StreamHandler(c)
}
func (h *APIHandlers) GetPortalInfo(c *gin.Context) {
	profile := domain.GetProfile(h.Domain.ActiveAura)
	c.JSON(http.StatusOK, profile)
}

func (h *APIHandlers) SetNetworkAura(c *gin.Context) {
	var req struct {
		Aura string `json:"aura"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Domain.SetAura(domain.AuraType(req.Aura)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "Aura synchronized", "aura": req.Aura})
}

// ============ Settings API Handlers ============

func (h *APIHandlers) GetSettings(c *gin.Context) {
	var settings []models.SystemSetting
	if err := h.DB.Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	result := make(map[string]interface{})
	for _, s := range settings {
		result[s.Key] = s.Value
	}
	c.JSON(http.StatusOK, result)
}

func (h *APIHandlers) UpdateSettings(c *gin.Context) {
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for key, value := range updates {
		valStr := fmt.Sprintf("%v", value)
		err := h.DB.Where(models.SystemSetting{Key: key}).
			Assign(models.SystemSetting{Value: valStr}).
			FirstOrCreate(&models.SystemSetting{}).Error
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Settings updated successfully"})
}
