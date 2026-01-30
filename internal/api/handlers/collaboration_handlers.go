package handlers

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"networking-main/pkg/collaboration"

	"github.com/gin-gonic/gin"
)

// ============ Ticketing API Handlers ============

func (h *APIHandlers) GetTickets(c *gin.Context) {
	var tickets []collaboration.Ticket
	if err := h.DB.Find(&tickets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tickets)
}

func (h *APIHandlers) GetTicketStats(c *gin.Context) {
	stats, err := h.ticketingSystem.GetTicketStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *APIHandlers) CreateTicket(c *gin.Context) {
	var ticket collaboration.Ticket
	if err := c.ShouldBindJSON(&ticket); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetUint("user_id")
	username := c.GetString("username")
	ticket.ReporterID = userID
	ticket.ReporterName = username

	if err := h.ticketingSystem.CreateTicket(&ticket); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, ticket)
}

func (h *APIHandlers) AssignTicket(c *gin.Context) {
	ticketID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var body struct {
		TechnicianID uint `json:"technician_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetUint("user_id")
	username := c.GetString("username")

	if err := h.ticketingSystem.AssignTicket(uint(ticketID), body.TechnicianID, userID, username); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ticket assigned successfully"})
}

func (h *APIHandlers) ResolveTicket(c *gin.Context) {
	ticketID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var body struct {
		Resolution string `json:"resolution"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetUint("user_id")

	if err := h.ticketingSystem.ResolveTicket(uint(ticketID), userID, body.Resolution); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ticket resolved successfully"})
}

func (h *APIHandlers) GetActiveDispatches(c *gin.Context) {
	userID := c.GetUint("user_id")
	role := c.GetString("role")

	if role != "technician" && role != "admin" {
		c.JSON(http.StatusOK, []collaboration.TechnicianDispatch{})
		return
	}

	dispatches, err := h.ticketingSystem.GetActiveDispatches(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dispatches)
}

// ============ Chat API Handlers ============

func (h *APIHandlers) ChatWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket Upgrade Error: %v", err)
		return
	}

	userID := c.GetUint("user_id")
	username := c.GetString("username")
	role := c.GetString("role")

	client := &collaboration.ChatClient{
		ID:       strconv.FormatUint(uint64(userID), 10) + "-" + strconv.FormatInt(time.Now().Unix(), 10),
		UserID:   userID,
		Username: username,
		Role:     role,
		Conn:     conn,
		Hub:      h.chatHub,
		Send:     make(chan []byte, 256),
		Rooms:    make(map[string]bool),
	}

	h.chatHub.Register <- client

	go client.ReadPump()
	go client.WritePump()
}

func (h *APIHandlers) GetChatRooms(c *gin.Context) {
	rooms := h.chatHub.GetRooms()
	userID := c.GetUint("user_id")
	userIDStr := strconv.FormatUint(uint64(userID), 10)

	// Create simplified response with unread count
	type RoomResponse struct {
		*collaboration.ChatRoom
		UnreadCount int `json:"unread_count"`
	}

	response := make([]RoomResponse, len(rooms))
	for i, room := range rooms {
		// Calculate unread count for this user
		var unreadCount int64
		h.DB.Model(&collaboration.ChatMessage{}).
			Where("room_id = ? AND user_id != ? AND (read_by IS NULL OR read_by NOT LIKE ?)",
				room.ID, userID, "%\""+userIDStr+"\"%").
			Count(&unreadCount)

		response[i] = RoomResponse{
			ChatRoom:    room,
			UnreadCount: int(unreadCount),
		}
	}

	c.JSON(http.StatusOK, response)
}

func (h *APIHandlers) GetChatMessages(c *gin.Context) {
	roomID := c.Param("roomID")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	messages, err := h.chatHub.GetRoomHistory(roomID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, messages)
}
