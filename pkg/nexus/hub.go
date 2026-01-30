package nexus

import (
	"encoding/json"
	"log"
	"net/http"
	"runtime"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// Hub maintains the set of active clients and broadcasts messages to them.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	// Metrics
	totalRequests  uint64
	activeRequests int64
	blockedReqs    uint64
	bytesIn        uint64
	bytesOut       uint64

	// Guards
	mu sync.RWMutex
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Global Hub instance
var NexusHub *Hub

func init() {
	NexusHub = NewHub()
	go NexusHub.Run()
	go NexusHub.MetricsLoop()
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()
		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// MetricsLoop gathers and broadcasts system stats every second
func (h *Hub) MetricsLoop() {
	ticker := time.NewTicker(1000 * time.Millisecond) // 1Hz update rate
	defer ticker.Stop()

	for range ticker.C {
		stats := h.GatherStats()
		payload, _ := json.Marshal(stats)
		h.broadcast <- payload
	}
}

type SystemStats struct {
	Timestamp       string `json:"timestamp"`
	Goroutines      int    `json:"goroutines"`
	MemoryUsage     uint64 `json:"memory_usage"` // Bytes
	TotalRequests   uint64 `json:"total_requests"`
	ActiveRequests  int64  `json:"active_requests"`
	BlockedRequests uint64 `json:"blocked_requests"`
	RPS             uint64 `json:"rps"` // Approximate
}

var lastRequestCount uint64

func (h *Hub) GatherStats() SystemStats {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	currentTotal := atomic.LoadUint64(&h.totalRequests)
	rps := currentTotal - lastRequestCount
	lastRequestCount = currentTotal

	return SystemStats{
		Timestamp:       time.Now().Format(time.RFC3339),
		Goroutines:      runtime.NumGoroutine(),
		MemoryUsage:     m.Alloc,
		TotalRequests:   currentTotal,
		ActiveRequests:  atomic.LoadInt64(&h.activeRequests),
		BlockedRequests: atomic.LoadUint64(&h.blockedReqs),
		RPS:             rps,
	}
}

// Metric Recorders

func (h *Hub) RecordRequest() {
	atomic.AddUint64(&h.totalRequests, 1)
	atomic.AddInt64(&h.activeRequests, 1)
}

func (h *Hub) RecordResponse() {
	atomic.AddInt64(&h.activeRequests, -1)
}

func (h *Hub) RecordBlock() {
	atomic.AddUint64(&h.blockedReqs, 1)
}

// WebSocket Handler
func StreamHandler(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("Nexus WS Upgrade Error:", err)
		return
	}

	client := &Client{hub: NexusHub, conn: conn, send: make(chan []byte, 256)}
	client.hub.register <- client

	// Start pump routines
	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
		// We ignore incoming messages for now, this is a broadcast stream
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(50 * time.Second) // Ping to keep alive
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.conn.WriteMessage(websocket.TextMessage, message)
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
