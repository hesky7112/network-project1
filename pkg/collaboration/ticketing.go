package collaboration

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// TicketingSystem manages incident tickets and technician dispatch
type TicketingSystem struct {
	db      *gorm.DB
	chatHub *ChatHub
}

// Ticket represents an incident ticket
type Ticket struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	Type            string    `json:"type"` // "incident", "maintenance", "change_request"
	Priority        string    `json:"priority"` // "critical", "high", "medium", "low"
	Status          string    `json:"status"` // "open", "assigned", "in_progress", "resolved", "closed"
	DeviceID        *uint     `json:"device_id"`
	DeviceName      string    `json:"device_name"`
	Location        *GeoLocation `json:"location" gorm:"embedded;embeddedPrefix:location_"`
	Site            string    `json:"site"`
	Building        string    `json:"building"`
	Floor           string    `json:"floor"`
	ReporterID      uint      `json:"reporter_id"`
	ReporterName    string    `json:"reporter_name"`
	AssignedTo      *uint     `json:"assigned_to"`
	AssigneeName    string    `json:"assignee_name"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	ResolvedAt      *time.Time `json:"resolved_at"`
	EstimatedTime   int       `json:"estimated_time"` // in minutes
	ActualTime      int       `json:"actual_time"` // in minutes
	ChatRoomID      string    `json:"chat_room_id"`
	Tags            string    `json:"tags" gorm:"type:jsonb"`
	Attachments     string    `json:"attachments" gorm:"type:jsonb"`
	ImpactedDevices string    `json:"impacted_devices" gorm:"type:jsonb"`
	ImpactedUsers   int       `json:"impacted_users"`
}

// TicketUpdate represents a ticket update/comment
type TicketUpdate struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	TicketID  uint      `json:"ticket_id"`
	UserID    uint      `json:"user_id"`
	Username  string    `json:"username"`
	UpdateType string   `json:"update_type"` // "comment", "status_change", "assignment", "resolution"
	Message   string    `json:"message"`
	OldValue  string    `json:"old_value"`
	NewValue  string    `json:"new_value"`
	CreatedAt time.Time `json:"created_at"`
}

// TechnicianDispatch represents a technician dispatch request
type TechnicianDispatch struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	TicketID        uint      `json:"ticket_id"`
	TechnicianID    uint      `json:"technician_id"`
	TechnicianName  string    `json:"technician_name"`
	Status          string    `json:"status"` // "requested", "accepted", "en_route", "on_site", "completed"
	RequestedAt     time.Time `json:"requested_at"`
	AcceptedAt      *time.Time `json:"accepted_at"`
	ArrivedAt       *time.Time `json:"arrived_at"`
	CompletedAt     *time.Time `json:"completed_at"`
	EstimatedArrival time.Time `json:"estimated_arrival"`
	Distance        float64   `json:"distance"` // in kilometers
	TravelTime      int       `json:"travel_time"` // in minutes
	Location        *GeoLocation `json:"location" gorm:"embedded;embeddedPrefix:location_"`
	Notes           string    `json:"notes"`
}

// NewTicketingSystem creates a new ticketing system
func NewTicketingSystem(db *gorm.DB, chatHub *ChatHub) *TicketingSystem {
	ts := &TicketingSystem{
		db:      db,
		chatHub: chatHub,
	}

	return ts
}

// CreateTicket creates a new ticket
func (ts *TicketingSystem) CreateTicket(ticket *Ticket) error {
	ticket.Status = "open"
	ticket.CreatedAt = time.Now()
	ticket.UpdatedAt = time.Now()

	if err := ts.db.Create(ticket).Error; err != nil {
		return err
	}

	// Create chat room for the ticket
	roomID := fmt.Sprintf("ticket-%d", ticket.ID)
	metadata := map[string]interface{}{
		"ticket_id": ticket.ID,
		"priority":  ticket.Priority,
		"site":      ticket.Site,
	}
	ts.chatHub.CreateRoom(roomID, fmt.Sprintf("Ticket #%d: %s", ticket.ID, ticket.Title), "incident", metadata)
	ticket.ChatRoomID = roomID
	ts.db.Save(ticket)

	// Auto-assign based on proximity if location is available
	if ticket.Location != nil && ticket.Priority == "critical" {
		go ts.AutoDispatchTechnician(ticket)
	}

	// Notify relevant users
	ts.notifyTicketCreated(ticket)

	return nil
}

// UpdateTicket updates a ticket
func (ts *TicketingSystem) UpdateTicket(ticketID uint, updates map[string]interface{}, userID uint, username string) error {
	var ticket Ticket
	if err := ts.db.First(&ticket, ticketID).Error; err != nil {
		return err
	}

	// Track changes
	for field, newValue := range updates {
		var oldValue interface{}
		switch field {
		case "status":
			oldValue = ticket.Status
		case "priority":
			oldValue = ticket.Priority
		case "assigned_to":
			oldValue = ticket.AssignedTo
		}

		// Create update record
		update := &TicketUpdate{
			TicketID:   ticketID,
			UserID:     userID,
			Username:   username,
			UpdateType: "status_change",
			OldValue:   fmt.Sprintf("%v", oldValue),
			NewValue:   fmt.Sprintf("%v", newValue),
			CreatedAt:  time.Now(),
		}
		ts.db.Create(update)

		// Send chat notification
		message := fmt.Sprintf("%s changed %s from %v to %v", username, field, oldValue, newValue)
		ts.chatHub.SendMessage("system", ticket.ChatRoomID, message)
	}

	updates["updated_at"] = time.Now()
	if err := ts.db.Model(&ticket).Updates(updates).Error; err != nil {
		return err
	}

	return nil
}

// AssignTicket assigns a ticket to a technician
func (ts *TicketingSystem) AssignTicket(ticketID, technicianID uint, assignerID uint, assignerName string) error {
	var ticket Ticket
	if err := ts.db.First(&ticket, ticketID).Error; err != nil {
		return err
	}

	ticket.AssignedTo = &technicianID
	ticket.Status = "assigned"
	ticket.UpdatedAt = time.Now()

	if err := ts.db.Save(&ticket).Error; err != nil {
		return err
	}

	// Create update record
	update := &TicketUpdate{
		TicketID:   ticketID,
		UserID:     assignerID,
		Username:   assignerName,
		UpdateType: "assignment",
		Message:    fmt.Sprintf("Ticket assigned to technician ID %d", technicianID),
		CreatedAt:  time.Now(),
	}
	ts.db.Create(update)

	// Notify technician
	ts.notifyTechnicianAssigned(ticket.ID, technicianID)

	// Add technician to chat room
	// (Would need technician's client ID from active connections)

	return nil
}

// AutoDispatchTechnician automatically dispatches the nearest available technician
func (ts *TicketingSystem) AutoDispatchTechnician(ticket *Ticket) error {
	if ticket.Location == nil {
		return fmt.Errorf("ticket has no location")
	}

	// Find nearby technicians (within 50km)
	nearbyTechs := ts.chatHub.FindNearbyClients(ticket.Location, 50.0, "technician")

	if len(nearbyTechs) == 0 {
		// Try site-based dispatch
		siteTechs := ts.chatHub.FindClientsBySite(ticket.Site, "technician")
		if len(siteTechs) == 0 {
			return fmt.Errorf("no available technicians found")
		}
		nearbyTechs = siteTechs
	}

	// Find the closest available technician
	var closestTech *ChatClient
	minDistance := 999999.0

	for _, tech := range nearbyTechs {
		if tech.Location == nil {
			continue
		}

		distance := calculateDistance(
			ticket.Location.Latitude, ticket.Location.Longitude,
			tech.Location.Latitude, tech.Location.Longitude,
		)

		if distance < minDistance {
			minDistance = distance
			closestTech = tech
		}
	}

	if closestTech == nil {
		return fmt.Errorf("no technician with location found")
	}

	// Create dispatch request
	dispatch := &TechnicianDispatch{
		TicketID:         ticket.ID,
		TechnicianID:     closestTech.UserID,
		TechnicianName:   closestTech.Username,
		Status:           "requested",
		RequestedAt:      time.Now(),
		Distance:         minDistance,
		TravelTime:       int(minDistance / 0.5), // Assume 30 km/h average speed
		EstimatedArrival: time.Now().Add(time.Duration(minDistance/0.5) * time.Minute),
		Location:         ticket.Location,
	}

	if err := ts.db.Create(dispatch).Error; err != nil {
		return err
	}

	// Notify technician
	notification := map[string]interface{}{
		"type":        "dispatch_request",
		"ticket_id":   ticket.ID,
		"dispatch_id": dispatch.ID,
		"title":       ticket.Title,
		"priority":    ticket.Priority,
		"location":    ticket.Location,
		"distance":    minDistance,
		"travel_time": dispatch.TravelTime,
	}

	ts.chatHub.NotifyClients([]string{closestTech.ID}, notification)

	// Send chat message
	message := fmt.Sprintf("🚨 Auto-dispatched to %s (%.1f km away, ETA: %d min)", 
		closestTech.Username, minDistance, dispatch.TravelTime)
	ts.chatHub.SendMessage("system", ticket.ChatRoomID, message)

	return nil
}

// AcceptDispatch technician accepts a dispatch request
func (ts *TicketingSystem) AcceptDispatch(dispatchID, technicianID uint) error {
	var dispatch TechnicianDispatch
	if err := ts.db.First(&dispatch, dispatchID).Error; err != nil {
		return err
	}

	if dispatch.TechnicianID != technicianID {
		return fmt.Errorf("dispatch not assigned to this technician")
	}

	now := time.Now()
	dispatch.Status = "accepted"
	dispatch.AcceptedAt = &now

	if err := ts.db.Save(&dispatch).Error; err != nil {
		return err
	}

	// Update ticket status
	ts.UpdateTicket(dispatch.TicketID, map[string]interface{}{
		"status": "in_progress",
	}, technicianID, dispatch.TechnicianName)

	// Notify in chat
	var ticket Ticket
	ts.db.First(&ticket, dispatch.TicketID)
	message := fmt.Sprintf("✅ %s accepted the dispatch and is en route", dispatch.TechnicianName)
	ts.chatHub.SendMessage("system", ticket.ChatRoomID, message)

	return nil
}

// UpdateDispatchStatus updates dispatch status (en_route, on_site, completed)
func (ts *TicketingSystem) UpdateDispatchStatus(dispatchID uint, status string, location *GeoLocation) error {
	var dispatch TechnicianDispatch
	if err := ts.db.First(&dispatch, dispatchID).Error; err != nil {
		return err
	}

	now := time.Now()
	dispatch.Status = status

	switch status {
	case "en_route":
		// Already handled in AcceptDispatch
	case "on_site":
		dispatch.ArrivedAt = &now
	case "completed":
		dispatch.CompletedAt = &now
	}

	if location != nil {
		dispatch.Location = location
	}

	if err := ts.db.Save(&dispatch).Error; err != nil {
		return err
	}

	// Notify in chat
	var ticket Ticket
	ts.db.First(&ticket, dispatch.TicketID)

	var message string
	switch status {
	case "on_site":
		message = fmt.Sprintf("📍 %s arrived on site", dispatch.TechnicianName)
	case "completed":
		message = fmt.Sprintf("✅ %s completed the work", dispatch.TechnicianName)
		// Auto-resolve ticket
		ts.ResolveTicket(ticket.ID, dispatch.TechnicianID, "Work completed by technician")
	}

	ts.chatHub.SendMessage("system", ticket.ChatRoomID, message)

	return nil
}

// ResolveTicket resolves a ticket
func (ts *TicketingSystem) ResolveTicket(ticketID, userID uint, resolution string) error {
	now := time.Now()
	updates := map[string]interface{}{
		"status":      "resolved",
		"resolved_at": now,
	}

	var ticket Ticket
	ts.db.First(&ticket, ticketID)

	// Calculate actual time
	actualTime := int(now.Sub(ticket.CreatedAt).Minutes())
	updates["actual_time"] = actualTime

	if err := ts.db.Model(&Ticket{}).Where("id = ?", ticketID).Updates(updates).Error; err != nil {
		return err
	}

	// Create resolution update
	update := &TicketUpdate{
		TicketID:   ticketID,
		UserID:     userID,
		UpdateType: "resolution",
		Message:    resolution,
		CreatedAt:  time.Now(),
	}
	ts.db.Create(update)

	// Notify in chat
	message := fmt.Sprintf("✅ Ticket resolved: %s (Total time: %d minutes)", resolution, actualTime)
	ts.chatHub.SendMessage("system", ticket.ChatRoomID, message)

	return nil
}

// GetTicketsByLocation gets tickets near a location
func (ts *TicketingSystem) GetTicketsByLocation(location *GeoLocation, radius float64, status string) ([]Ticket, error) {
	var tickets []Ticket
	query := ts.db.Where("location_latitude IS NOT NULL AND location_longitude IS NOT NULL")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Find(&tickets).Error; err != nil {
		return nil, err
	}

	// Filter by distance
	nearby := make([]Ticket, 0)
	for _, ticket := range tickets {
		if ticket.Location == nil {
			continue
		}

		distance := calculateDistance(
			location.Latitude, location.Longitude,
			ticket.Location.Latitude, ticket.Location.Longitude,
		)

		if distance <= radius {
			nearby = append(nearby, ticket)
		}
	}

	return nearby, nil
}

// GetTicketsBySite gets tickets at a specific site
func (ts *TicketingSystem) GetTicketsBySite(site string, status string) ([]Ticket, error) {
	var tickets []Ticket
	query := ts.db.Where("site = ?", site)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Find(&tickets).Error; err != nil {
		return nil, err
	}

	return tickets, nil
}

// GetTicketUpdates gets all updates for a ticket
func (ts *TicketingSystem) GetTicketUpdates(ticketID uint) ([]TicketUpdate, error) {
	var updates []TicketUpdate
	err := ts.db.Where("ticket_id = ?", ticketID).Order("created_at ASC").Find(&updates).Error
	return updates, err
}

// GetActiveDispatches gets all active dispatches for a technician
func (ts *TicketingSystem) GetActiveDispatches(technicianID uint) ([]TechnicianDispatch, error) {
	var dispatches []TechnicianDispatch
	err := ts.db.Where("technician_id = ? AND status IN ?", technicianID, 
		[]string{"requested", "accepted", "en_route", "on_site"}).
		Order("requested_at DESC").
		Find(&dispatches).Error
	return dispatches, err
}

// GetTicketStats gets statistics for tickets
func (ts *TicketingSystem) GetTicketStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Count by status
	var statusCounts []struct {
		Status string
		Count  int64
	}
	ts.db.Model(&Ticket{}).Select("status, count(*) as count").Group("status").Scan(&statusCounts)
	
	statusMap := make(map[string]int64)
	for _, sc := range statusCounts {
		statusMap[sc.Status] = sc.Count
	}
	stats["by_status"] = statusMap

	// Count by priority
	var priorityCounts []struct {
		Priority string
		Count    int64
	}
	ts.db.Model(&Ticket{}).Select("priority, count(*) as count").Group("priority").Scan(&priorityCounts)
	
	priorityMap := make(map[string]int64)
	for _, pc := range priorityCounts {
		priorityMap[pc.Priority] = pc.Count
	}
	stats["by_priority"] = priorityMap

	// Average resolution time
	var avgTime float64
	ts.db.Model(&Ticket{}).Where("status = ?", "resolved").Select("AVG(actual_time)").Scan(&avgTime)
	stats["avg_resolution_time_minutes"] = avgTime

	// Active dispatches
	var activeDispatches int64
	ts.db.Model(&TechnicianDispatch{}).Where("status IN ?", 
		[]string{"requested", "accepted", "en_route", "on_site"}).Count(&activeDispatches)
	stats["active_dispatches"] = activeDispatches

	return stats, nil
}

// Helper notification functions

func (ts *TicketingSystem) notifyTicketCreated(ticket *Ticket) {
	// Notify admins and relevant technicians
	notification := map[string]interface{}{
		"type":     "new_ticket",
		"ticket_id": ticket.ID,
		"title":    ticket.Title,
		"priority": ticket.Priority,
		"site":     ticket.Site,
	}

	ts.chatHub.BroadcastToRole("admin", notification)
	ts.chatHub.BroadcastToRole("technician", notification)
}

func (ts *TicketingSystem) notifyTechnicianAssigned(ticketID, technicianID uint) {
	// Would need to get technician's client ID from active connections
	// For now, just log
	fmt.Printf("Ticketing: Assigned ticket %d to technician %d\n", ticketID, technicianID)
}
