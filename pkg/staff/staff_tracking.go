package staff

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// StaffTrackingSystem manages staff work logs and attendance
type StaffTrackingSystem struct {
	db *gorm.DB
}

// StaffMember represents a staff member
type StaffMember struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"user_id" gorm:"uniqueIndex"`
	EmployeeID  string    `json:"employee_id" gorm:"uniqueIndex"`
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	Email       string    `json:"email"`
	Phone       string    `json:"phone"`
	Department  string    `json:"department"`
	Position    string    `json:"position"`
	HireDate    time.Time `json:"hire_date"`
	Status      string    `json:"status"` // active, on_leave, terminated
	ShiftStart  string    `json:"shift_start"` // HH:MM format
	ShiftEnd    string    `json:"shift_end"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Attendance represents daily attendance record
type Attendance struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	StaffID     uint      `json:"staff_id" gorm:"index"`
	Date        time.Time `json:"date" gorm:"index"`
	CheckIn     time.Time `json:"check_in"`
	CheckOut    *time.Time `json:"check_out"`
	Status      string    `json:"status"` // present, late, absent, half_day, on_leave
	WorkHours   float64   `json:"work_hours"`
	Location    string    `json:"location"` // office, remote, field
	IPAddress   string    `json:"ip_address"`
	Notes       string    `json:"notes"`
	ApprovedBy  *uint     `json:"approved_by"`
	CreatedAt   time.Time `json:"created_at"`
}

// WorkLog represents detailed work activity log
type WorkLog struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	StaffID     uint      `json:"staff_id" gorm:"index"`
	Date        time.Time `json:"date" gorm:"index"`
	Activity    string    `json:"activity"`
	Description string    `json:"description"`
	Category    string    `json:"category"` // ticket, maintenance, meeting, training, other
	TicketID    *uint     `json:"ticket_id"`
	DeviceID    *uint     `json:"device_id"`
	StartTime   time.Time `json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
	Duration    int       `json:"duration"` // minutes
	Status      string    `json:"status"` // in_progress, completed, paused
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"created_at"`
}

// LeaveRequest represents leave/time-off request
type LeaveRequest struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	StaffID     uint      `json:"staff_id" gorm:"index"`
	LeaveType   string    `json:"leave_type"` // sick, vacation, personal, emergency
	StartDate   time.Time `json:"start_date"`
	EndDate     time.Time `json:"end_date"`
	Days        int       `json:"days"`
	Reason      string    `json:"reason"`
	Status      string    `json:"status"` // pending, approved, rejected
	ApprovedBy  *uint     `json:"approved_by"`
	ApprovedAt  *time.Time `json:"approved_at"`
	Comments    string    `json:"comments"`
	CreatedAt   time.Time `json:"created_at"`
}

// PerformanceMetric represents staff performance metrics
type PerformanceMetric struct {
	ID                uint      `json:"id" gorm:"primaryKey"`
	StaffID           uint      `json:"staff_id" gorm:"index"`
	Period            string    `json:"period"` // daily, weekly, monthly
	Date              time.Time `json:"date" gorm:"index"`
	TicketsResolved   int       `json:"tickets_resolved"`
	AvgResolutionTime float64   `json:"avg_resolution_time"` // minutes
	TasksCompleted    int       `json:"tasks_completed"`
	WorkHours         float64   `json:"work_hours"`
	AttendanceRate    float64   `json:"attendance_rate"` // percentage
	Rating            float64   `json:"rating"` // 0-5
	CreatedAt         time.Time `json:"created_at"`
}

// NewStaffTrackingSystem creates a new staff tracking system
func NewStaffTrackingSystem(db *gorm.DB) *StaffTrackingSystem {
	sts := &StaffTrackingSystem{db: db}
	return sts
}

// CreateStaffMember creates a new staff member
func (sts *StaffTrackingSystem) CreateStaffMember(staff *StaffMember) error {
	staff.Status = "active"
	staff.CreatedAt = time.Now()
	return sts.db.Create(staff).Error
}

// CheckIn records staff check-in
func (sts *StaffTrackingSystem) CheckIn(staffID uint, location, ipAddress string) (*Attendance, error) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	// Check if already checked in today
	var existing Attendance
	result := sts.db.Where("staff_id = ? AND date = ?", staffID, today).First(&existing)
	if result.Error == nil {
		return nil, fmt.Errorf("already checked in today")
	}

	// Get staff member for shift info
	var staff StaffMember
	if err := sts.db.First(&staff, staffID).Error; err != nil {
		return nil, err
	}

	attendance := &Attendance{
		StaffID:   staffID,
		Date:      today,
		CheckIn:   now,
		Location:  location,
		IPAddress: ipAddress,
		Status:    sts.determineAttendanceStatus(now, staff.ShiftStart),
		CreatedAt: now,
	}

	if err := sts.db.Create(attendance).Error; err != nil {
		return nil, err
	}

	return attendance, nil
}

// CheckOut records staff check-out
func (sts *StaffTrackingSystem) CheckOut(staffID uint) error {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	var attendance Attendance
	if err := sts.db.Where("staff_id = ? AND date = ?", staffID, today).First(&attendance).Error; err != nil {
		return fmt.Errorf("no check-in record found for today")
	}

	if attendance.CheckOut != nil {
		return fmt.Errorf("already checked out")
	}

	attendance.CheckOut = &now
	attendance.WorkHours = now.Sub(attendance.CheckIn).Hours()

	return sts.db.Save(&attendance).Error
}

// LogWork creates a work log entry
func (sts *StaffTrackingSystem) LogWork(log *WorkLog) error {
	log.Status = "in_progress"
	log.StartTime = time.Now()
	log.CreatedAt = time.Now()
	return sts.db.Create(log).Error
}

// CompleteWorkLog marks a work log as completed
func (sts *StaffTrackingSystem) CompleteWorkLog(logID uint, notes string) error {
	var log WorkLog
	if err := sts.db.First(&log, logID).Error; err != nil {
		return err
	}

	now := time.Now()
	log.EndTime = &now
	log.Duration = int(now.Sub(log.StartTime).Minutes())
	log.Status = "completed"
	if notes != "" {
		log.Notes = notes
	}

	return sts.db.Save(&log).Error
}

// RequestLeave creates a leave request
func (sts *StaffTrackingSystem) RequestLeave(request *LeaveRequest) error {
	request.Days = int(request.EndDate.Sub(request.StartDate).Hours() / 24)
	request.Status = "pending"
	request.CreatedAt = time.Now()
	return sts.db.Create(request).Error
}

// ApproveLeave approves a leave request
func (sts *StaffTrackingSystem) ApproveLeave(requestID, approverID uint, comments string) error {
	var request LeaveRequest
	if err := sts.db.First(&request, requestID).Error; err != nil {
		return err
	}

	now := time.Now()
	request.Status = "approved"
	request.ApprovedBy = &approverID
	request.ApprovedAt = &now
	request.Comments = comments

	return sts.db.Save(&request).Error
}

// RejectLeave rejects a leave request
func (sts *StaffTrackingSystem) RejectLeave(requestID, approverID uint, comments string) error {
	var request LeaveRequest
	if err := sts.db.First(&request, requestID).Error; err != nil {
		return err
	}

	now := time.Now()
	request.Status = "rejected"
	request.ApprovedBy = &approverID
	request.ApprovedAt = &now
	request.Comments = comments

	return sts.db.Save(&request).Error
}

// GetAttendanceReport generates attendance report
func (sts *StaffTrackingSystem) GetAttendanceReport(staffID uint, startDate, endDate time.Time) (map[string]interface{}, error) {
	var records []Attendance
	err := sts.db.Where("staff_id = ? AND date BETWEEN ? AND ?", staffID, startDate, endDate).
		Order("date DESC").
		Find(&records).Error
	if err != nil {
		return nil, err
	}

	totalDays := int(endDate.Sub(startDate).Hours() / 24)
	presentDays := 0
	lateDays := 0
	totalHours := 0.0

	for _, record := range records {
		if record.Status == "present" || record.Status == "late" {
			presentDays++
		}
		if record.Status == "late" {
			lateDays++
		}
		totalHours += record.WorkHours
	}

	return map[string]interface{}{
		"total_days":      totalDays,
		"present_days":    presentDays,
		"absent_days":     totalDays - presentDays,
		"late_days":       lateDays,
		"attendance_rate": float64(presentDays) / float64(totalDays) * 100,
		"total_hours":     totalHours,
		"avg_hours_per_day": totalHours / float64(presentDays),
		"records":         records,
	}, nil
}

// GetWorkLogReport generates work log report
func (sts *StaffTrackingSystem) GetWorkLogReport(staffID uint, startDate, endDate time.Time) (map[string]interface{}, error) {
	var logs []WorkLog
	err := sts.db.Where("staff_id = ? AND date BETWEEN ? AND ?", staffID, startDate, endDate).
		Order("date DESC, start_time DESC").
		Find(&logs).Error
	if err != nil {
		return nil, err
	}

	totalTasks := len(logs)
	completedTasks := 0
	totalMinutes := 0

	categoryBreakdown := make(map[string]int)

	for _, log := range logs {
		if log.Status == "completed" {
			completedTasks++
			totalMinutes += log.Duration
		}
		categoryBreakdown[log.Category]++
	}

	return map[string]interface{}{
		"total_tasks":      totalTasks,
		"completed_tasks":  completedTasks,
		"in_progress":      totalTasks - completedTasks,
		"total_hours":      float64(totalMinutes) / 60,
		"avg_task_duration": float64(totalMinutes) / float64(completedTasks),
		"by_category":      categoryBreakdown,
		"logs":             logs,
	}, nil
}

// CalculatePerformanceMetrics calculates performance metrics
func (sts *StaffTrackingSystem) CalculatePerformanceMetrics(staffID uint, period string, date time.Time) error {
	var startDate, endDate time.Time

	switch period {
	case "daily":
		startDate = time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
		endDate = startDate.AddDate(0, 0, 1)
	case "weekly":
		startDate = date.AddDate(0, 0, -int(date.Weekday()))
		endDate = startDate.AddDate(0, 0, 7)
	case "monthly":
		startDate = time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, date.Location())
		endDate = startDate.AddDate(0, 1, 0)
	}

	// Get tickets resolved
	var ticketsResolved int64
	sts.db.Raw("SELECT COUNT(*) FROM tickets WHERE assigned_to = ? AND status = 'resolved' AND updated_at BETWEEN ? AND ?",
		staffID, startDate, endDate).Scan(&ticketsResolved)

	// Get average resolution time
	var avgResolutionTime float64
	sts.db.Raw("SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) FROM tickets WHERE assigned_to = ? AND status = 'resolved' AND updated_at BETWEEN ? AND ?",
		staffID, startDate, endDate).Scan(&avgResolutionTime)

	// Get completed tasks
	var tasksCompleted int64
	sts.db.Model(&WorkLog{}).Where("staff_id = ? AND status = 'completed' AND date BETWEEN ? AND ?",
		staffID, startDate, endDate).Count(&tasksCompleted)

	// Get work hours
	var totalHours float64
	sts.db.Model(&Attendance{}).Where("staff_id = ? AND date BETWEEN ? AND ?",
		staffID, startDate, endDate).Select("SUM(work_hours)").Scan(&totalHours)

	// Get attendance rate
	var presentDays int64
	sts.db.Model(&Attendance{}).Where("staff_id = ? AND date BETWEEN ? AND ? AND status IN ?",
		staffID, startDate, endDate, []string{"present", "late"}).Count(&presentDays)

	totalDays := int64(endDate.Sub(startDate).Hours() / 24)
	attendanceRate := float64(presentDays) / float64(totalDays) * 100

	metric := &PerformanceMetric{
		StaffID:           staffID,
		Period:            period,
		Date:              date,
		TicketsResolved:   int(ticketsResolved),
		AvgResolutionTime: avgResolutionTime,
		TasksCompleted:    int(tasksCompleted),
		WorkHours:         totalHours,
		AttendanceRate:    attendanceRate,
		Rating:            sts.calculateRating(ticketsResolved, avgResolutionTime, attendanceRate),
		CreatedAt:         time.Now(),
	}

	return sts.db.Create(metric).Error
}

// Helper functions

func (sts *StaffTrackingSystem) determineAttendanceStatus(checkInTime time.Time, _ string) string {
	// Parse shift start time
	// Simple implementation - in production, parse HH:MM format properly
	hour := checkInTime.Hour()
	
	// Assume 9 AM shift start
	if hour > 9 || (hour == 9 && checkInTime.Minute() > 15) {
		return "late"
	}
	return "present"
}

func (sts *StaffTrackingSystem) calculateRating(tickets int64, avgTime, attendance float64) float64 {
	rating := 3.0 // Base rating

	// Tickets resolved bonus
	if tickets > 20 {
		rating += 1.0
	} else if tickets > 10 {
		rating += 0.5
	}

	// Resolution time bonus
	if avgTime < 30 {
		rating += 0.5
	}

	// Attendance bonus
	if attendance >= 95 {
		rating += 0.5
	}

	if rating > 5.0 {
		rating = 5.0
	}

	return rating
}

// GetStaffByID retrieves staff member by ID
func (sts *StaffTrackingSystem) GetStaffByID(staffID uint) (*StaffMember, error) {
	var staff StaffMember
	err := sts.db.First(&staff, staffID).Error
	return &staff, err
}

// GetAllStaff retrieves all staff members
func (sts *StaffTrackingSystem) GetAllStaff() ([]StaffMember, error) {
	var staff []StaffMember
	err := sts.db.Where("status = ?", "active").Find(&staff).Error
	return staff, err
}

// GetTodayAttendance gets today's attendance for all staff
func (sts *StaffTrackingSystem) GetTodayAttendance() ([]Attendance, error) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	var attendance []Attendance
	err := sts.db.Where("date = ?", today).Find(&attendance).Error
	return attendance, err
}
