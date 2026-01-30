package collaboration

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

// ChatHub manages WebSocket connections and message routing
type ChatHub struct {
	db         *gorm.DB
	clients    map[string]*ChatClient
	rooms      map[string]*ChatRoom
	Broadcast  chan *ChatMessage
	Register   chan *ChatClient
	Unregister chan *ChatClient
	mutex      sync.RWMutex
}

// ChatClient represents a connected user
type ChatClient struct {
	ID       string
	UserID   uint
	Username string
	Role     string
	Conn     *websocket.Conn
	Hub      *ChatHub
	Send     chan []byte
	Rooms    map[string]bool
	Location *GeoLocation
}

// ChatRoom represents a chat room (incident, device, location-based)
type ChatRoom struct {
	ID        string                 `json:"id"`
	Name      string                 `json:"name"`
	Type      string                 `json:"type"` // "incident", "device", "location", "general"
	Clients   map[string]*ChatClient `json:"-"`
	Messages  []*ChatMessage         `json:"-"` // Don't serialize all messages in list view
	CreatedAt time.Time              `json:"created_at"`
	Metadata  map[string]interface{} `json:"metadata"`
	mutex     sync.RWMutex
}

// ChatMessage represents a chat message
type ChatMessage struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	RoomID    string    `json:"room_id"`
	UserID    uint      `json:"user_id"`
	Username  string    `json:"username"`
	Message   string    `json:"message"`
	Type      string    `json:"type"` // "text", "system", "alert", "technician_dispatch"
	Timestamp time.Time `json:"timestamp"`
	Metadata  string    `json:"metadata" gorm:"type:jsonb"`
	ReadBy    string    `json:"read_by" gorm:"type:jsonb"` // Array of user IDs who read the message
}

// BeforeCreate ensure valid JSON for postgres
func (cm *ChatMessage) BeforeCreate(tx *gorm.DB) (err error) {
	if cm.Metadata == "" {
		cm.Metadata = "{}"
	}
	if cm.ReadBy == "" {
		cm.ReadBy = "[]"
	}
	return
}

// GeoLocation represents a user's location
type GeoLocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Address   string  `json:"address"`
	Site      string  `json:"site"`
	Building  string  `json:"building"`
	Floor     string  `json:"floor"`
}

// NewChatHub creates a new chat hub
func NewChatHub(db *gorm.DB) *ChatHub {
	hub := &ChatHub{
		db:         db,
		clients:    make(map[string]*ChatClient),
		rooms:      make(map[string]*ChatRoom),
		Broadcast:  make(chan *ChatMessage, 256),
		Register:   make(chan *ChatClient),
		Unregister: make(chan *ChatClient),
	}

	return hub
}

// Run starts the chat hub
func (h *ChatHub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.registerClient(client)

		case client := <-h.Unregister:
			h.unregisterClient(client)

		case message := <-h.Broadcast:
			h.broadcastMessage(message)
		}
	}
}

// registerClient registers a new client
func (h *ChatHub) registerClient(client *ChatClient) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	h.clients[client.ID] = client
	fmt.Printf("Chat: Client %s (%s) connected\n", client.Username, client.ID)

	// Send system message
	systemMsg := &ChatMessage{
		RoomID:    "general",
		Username:  "System",
		Message:   fmt.Sprintf("%s joined the chat", client.Username),
		Type:      "system",
		Timestamp: time.Now(),
	}
	h.Broadcast <- systemMsg
}

// unregisterClient unregisters a client
func (h *ChatHub) unregisterClient(client *ChatClient) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if _, ok := h.clients[client.ID]; ok {
		delete(h.clients, client.ID)
		close(client.Send)

		// Remove from all rooms
		for roomID := range client.Rooms {
			if room, exists := h.rooms[roomID]; exists {
				room.mutex.Lock()
				delete(room.Clients, client.ID)
				room.mutex.Unlock()
			}
		}

		fmt.Printf("Chat: Client %s (%s) disconnected\n", client.Username, client.ID)
	}
}

// broadcastMessage broadcasts a message to a room
func (h *ChatHub) broadcastMessage(message *ChatMessage) {
	// Save to database
	h.db.Create(message)

	// Get room
	h.mutex.RLock()
	room, exists := h.rooms[message.RoomID]
	h.mutex.RUnlock()

	if !exists {
		return
	}

	// Add to room history
	room.mutex.Lock()
	room.Messages = append(room.Messages, message)
	if len(room.Messages) > 100 {
		room.Messages = room.Messages[1:] // Keep last 100 messages
	}
	room.mutex.Unlock()

	// Broadcast to all clients in room
	messageJSON, _ := json.Marshal(message)

	room.mutex.RLock()
	defer room.mutex.RUnlock()

	for _, client := range room.Clients {
		select {
		case client.Send <- messageJSON:
		default:
			close(client.Send)
			delete(h.clients, client.ID)
		}
	}
}

// CreateRoom creates a new chat room
func (h *ChatHub) CreateRoom(roomID, name, roomType string, metadata map[string]interface{}) *ChatRoom {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	room := &ChatRoom{
		ID:        roomID,
		Name:      name,
		Type:      roomType,
		Clients:   make(map[string]*ChatClient),
		Messages:  make([]*ChatMessage, 0),
		CreatedAt: time.Now(),
		Metadata:  metadata,
	}

	h.rooms[roomID] = room
	fmt.Printf("Chat: Created room %s (%s)\n", name, roomID)

	return room
}

// GetRooms returns all active chat rooms
func (h *ChatHub) GetRooms() []*ChatRoom {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	rooms := make([]*ChatRoom, 0, len(h.rooms))
	for _, room := range h.rooms {
		rooms = append(rooms, room)
	}
	return rooms
}

// JoinRoom adds a client to a room
func (h *ChatHub) JoinRoom(clientID, roomID string) error {
	h.mutex.RLock()
	client, clientExists := h.clients[clientID]
	room, roomExists := h.rooms[roomID]
	h.mutex.RUnlock()

	if !clientExists {
		return fmt.Errorf("client not found")
	}
	if !roomExists {
		return fmt.Errorf("room not found")
	}

	room.mutex.Lock()
	room.Clients[clientID] = client
	room.mutex.Unlock()

	client.Rooms[roomID] = true

	// Send join message
	joinMsg := &ChatMessage{
		RoomID:    roomID,
		Username:  "System",
		Message:   fmt.Sprintf("%s joined %s", client.Username, room.Name),
		Type:      "system",
		Timestamp: time.Now(),
	}
	h.Broadcast <- joinMsg

	return nil
}

// LeaveRoom removes a client from a room
func (h *ChatHub) LeaveRoom(clientID, roomID string) error {
	h.mutex.RLock()
	client, clientExists := h.clients[clientID]
	room, roomExists := h.rooms[roomID]
	h.mutex.RUnlock()

	if !clientExists || !roomExists {
		return fmt.Errorf("client or room not found")
	}

	room.mutex.Lock()
	delete(room.Clients, clientID)
	room.mutex.Unlock()

	delete(client.Rooms, roomID)

	return nil
}

// SendMessage sends a message to a room
func (h *ChatHub) SendMessage(clientID, roomID, message string) error {
	h.mutex.RLock()
	client, exists := h.clients[clientID]
	h.mutex.RUnlock()

	if !exists {
		return fmt.Errorf("client not found")
	}

	msg := &ChatMessage{
		RoomID:    roomID,
		UserID:    client.UserID,
		Username:  client.Username,
		Message:   message,
		Type:      "text",
		Timestamp: time.Now(),
	}

	h.Broadcast <- msg
	return nil
}

// GetRoomHistory retrieves message history for a room
func (h *ChatHub) GetRoomHistory(roomID string, limit int) ([]*ChatMessage, error) {
	var messages []*ChatMessage
	query := h.db.Where("room_id = ?", roomID).Order("timestamp DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&messages).Error; err != nil {
		return nil, err
	}

	// Reverse to get chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

// GetOnlineUsers returns all online users
func (h *ChatHub) GetOnlineUsers() []map[string]interface{} {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	users := make([]map[string]interface{}, 0, len(h.clients))
	for _, client := range h.clients {
		user := map[string]interface{}{
			"id":       client.ID,
			"user_id":  client.UserID,
			"username": client.Username,
			"role":     client.Role,
			"location": client.Location,
		}
		users = append(users, user)
	}

	return users
}

// GetRoomMembers returns all members in a room
func (h *ChatHub) GetRoomMembers(roomID string) []map[string]interface{} {
	h.mutex.RLock()
	room, exists := h.rooms[roomID]
	h.mutex.RUnlock()

	if !exists {
		return []map[string]interface{}{}
	}

	room.mutex.RLock()
	defer room.mutex.RUnlock()

	members := make([]map[string]interface{}, 0, len(room.Clients))
	for _, client := range room.Clients {
		member := map[string]interface{}{
			"id":       client.ID,
			"username": client.Username,
			"role":     client.Role,
			"location": client.Location,
		}
		members = append(members, member)
	}

	return members
}

// UpdateClientLocation updates a client's location
func (h *ChatHub) UpdateClientLocation(clientID string, location *GeoLocation) error {
	h.mutex.RLock()
	client, exists := h.clients[clientID]
	h.mutex.RUnlock()

	if !exists {
		return fmt.Errorf("client not found")
	}

	client.Location = location
	return nil
}

// FindNearbyClients finds clients near a location
func (h *ChatHub) FindNearbyClients(location *GeoLocation, maxDistance float64, role string) []*ChatClient {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	nearby := make([]*ChatClient, 0)

	for _, client := range h.clients {
		if client.Location == nil {
			continue
		}

		// Filter by role if specified
		if role != "" && client.Role != role {
			continue
		}

		// Calculate distance
		distance := calculateDistance(
			location.Latitude, location.Longitude,
			client.Location.Latitude, client.Location.Longitude,
		)

		if distance <= maxDistance {
			nearby = append(nearby, client)
		}
	}

	return nearby
}

// FindClientsBySite finds clients at a specific site
func (h *ChatHub) FindClientsBySite(site string, role string) []*ChatClient {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	clients := make([]*ChatClient, 0)

	for _, client := range h.clients {
		if client.Location == nil {
			continue
		}

		if client.Location.Site == site {
			if role == "" || client.Role == role {
				clients = append(clients, client)
			}
		}
	}

	return clients
}

// NotifyClients sends a notification to specific clients
func (h *ChatHub) NotifyClients(clientIDs []string, notification map[string]interface{}) {
	notificationJSON, _ := json.Marshal(notification)

	h.mutex.RLock()
	defer h.mutex.RUnlock()

	for _, clientID := range clientIDs {
		if client, exists := h.clients[clientID]; exists {
			select {
			case client.Send <- notificationJSON:
			default:
				// Client's send channel is full, skip
			}
		}
	}
}

// BroadcastToRole broadcasts a message to all users with a specific role
func (h *ChatHub) BroadcastToRole(role string, message map[string]interface{}) {
	messageJSON, _ := json.Marshal(message)

	h.mutex.RLock()
	defer h.mutex.RUnlock()

	for _, client := range h.clients {
		if client.Role == role {
			select {
			case client.Send <- messageJSON:
			default:
				// Skip if send channel is full
			}
		}
	}
}

// Helper functions

// calculateDistance calculates the distance between two coordinates in kilometers
// Using Haversine formula
func calculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6371.0 // Earth's radius in kilometers

	// Convert to radians
	lat1Rad := lat1 * 3.14159265359 / 180
	lon1Rad := lon1 * 3.14159265359 / 180
	lat2Rad := lat2 * 3.14159265359 / 180
	lon2Rad := lon2 * 3.14159265359 / 180

	// Haversine formula
	dLat := lat2Rad - lat1Rad
	dLon := lon2Rad - lon1Rad

	a := 0.5 - 0.5*cosine(dLat) + cosine(lat1Rad)*cosine(lat2Rad)*(1-cosine(dLon))/2

	return earthRadius * 2 * asin(sqrt(a))
}

func cosine(x float64) float64 {
	// Simple cosine approximation
	return 1 - x*x/2 + x*x*x*x/24
}

func asin(x float64) float64 {
	// Simple arcsin approximation
	return x + x*x*x/6
}

func sqrt(x float64) float64 {
	// Newton's method for square root
	if x == 0 {
		return 0
	}
	z := x
	for i := 0; i < 10; i++ {
		z = (z + x/z) / 2
	}
	return z
}

// ReadPump pumps messages from the websocket connection to the hub
func (c *ChatClient) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}

		// Parse message
		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		// Handle different message types
		msgType, _ := msg["type"].(string)
		switch msgType {
		case "chat":
			roomID, _ := msg["room_id"].(string)
			text, _ := msg["message"].(string)
			c.Hub.SendMessage(c.ID, roomID, text)

		case "join_room":
			roomID, _ := msg["room_id"].(string)
			c.Hub.JoinRoom(c.ID, roomID)

		case "leave_room":
			roomID, _ := msg["room_id"].(string)
			c.Hub.LeaveRoom(c.ID, roomID)

		case "location_update":
			if loc, ok := msg["location"].(map[string]interface{}); ok {
				location := &GeoLocation{
					Latitude:  loc["latitude"].(float64),
					Longitude: loc["longitude"].(float64),
					Address:   loc["address"].(string),
					Site:      loc["site"].(string),
					Building:  loc["building"].(string),
					Floor:     loc["floor"].(string),
				}
				c.Hub.UpdateClientLocation(c.ID, location)
			}
		}
	}
}

// WritePump pumps messages from the hub to the websocket connection
func (c *ChatClient) WritePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
