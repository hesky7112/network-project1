package ingest

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// StreamType defines the protocol used for ingestion
type StreamType string

const (
	TCP       StreamType = "TCP"
	UDP       StreamType = "UDP"
	WebSocket StreamType = "WS"
	GRPC      StreamType = "GRPC"
)

// IngestService handles universal data streaming
type IngestService struct {
	Ctx    context.Context
	Cancel context.CancelFunc
	wg     sync.WaitGroup
	upgrad websocket.Upgrader
}

func NewIngestService() *IngestService {
	ctx, cancel := context.WithCancel(context.Background())
	return &IngestService{
		Ctx:    ctx,
		Cancel: cancel,
		upgrad: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
	}
}

// StartTCPServer starts a high-performance TCP listener
func (s *IngestService) StartTCPServer(port int) error {
	addr := fmt.Sprintf(":%d", port)
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}
	defer listener.Close()

	fmt.Printf("[INGEST] TCP Engine running on %s\n", addr)
	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		for {
			conn, err := listener.Accept()
			if err != nil {
				select {
				case <-s.Ctx.Done():
					return
				default:
					fmt.Printf("[INGEST] TCP Accept Error: %v\n", err)
					continue
				}
			}
			go s.handleTCP(conn)
		}
	}()
	return nil
}

func (s *IngestService) handleTCP(conn net.Conn) {
	defer conn.Close()
	buf := make([]byte, 4096)
	for {
		n, err := conn.Read(buf)
		if err != nil {
			return
		}
		// Bridge to Nexus (Mock for now, will call Python API)
		fmt.Printf("[INGEST] TCP Received: %d bytes\n", n)
	}
}

// StartUDPServer starts a speed-optimized UDP listener
func (s *IngestService) StartUDPServer(port int) error {
	addr := fmt.Sprintf(":%d", port)
	conn, err := net.ListenPacket("udp", addr)
	if err != nil {
		return err
	}
	defer conn.Close()

	fmt.Printf("[INGEST] UDP Engine running on %s\n", addr)
	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		buf := make([]byte, 2048)
		for {
			n, _, err := conn.ReadFrom(buf)
			if err != nil {
				return
			}
			fmt.Printf("[INGEST] UDP Received: %d bytes\n", n)
		}
	}()
	return nil
}

// HandleWS handles WebSocket-based real-time ingestion
func (s *IngestService) HandleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrad.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	fmt.Println("[INGEST] WebSocket Peer Connected")
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}
		fmt.Printf("[INGEST] WS Received: %s\n", string(msg))
	}
}

func (s *IngestService) Shutdown() {
	s.Cancel()
	s.wg.Wait()
}
