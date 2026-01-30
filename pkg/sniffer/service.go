package sniffer

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/gopacket"
	"github.com/google/gopacket/layers"
	"github.com/google/gopacket/pcap"
	"github.com/gorilla/websocket"
)

// Service handles packet capture and streaming
type Service struct {
	// In a real King tier app, we'd have a map of active captures
}

func NewService() *Service {
	return &Service{}
}

// PacketMetadata represents a simplified packet for UI visualization
type PacketMetadata struct {
	Timestamp string `json:"timestamp"`
	SrcIP     string `json:"src_ip"`
	DstIP     string `json:"dst_ip"`
	Protocol  string `json:"protocol"`
	Length    int    `json:"length"`
	Info      string `json:"info"`
}

// StartCapture streams packets from a specific interface to a WebSocket
func (s *Service) StartCapture(ctx context.Context, iface string, conn *websocket.Conn) error {
	// Open device
	// In Windows, need Npcap installed. In Linux, libpcap.
	// We use a promiscuous mode with a timeout
	handle, err := pcap.OpenLive(iface, 1600, true, pcap.BlockForever)
	if err != nil {
		return fmt.Errorf("failed to open device: %v", err)
	}
	defer handle.Close()

	packetSource := gopacket.NewPacketSource(handle, handle.LinkType())

	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil
		case packet := <-packetSource.Packets():
			// Process packet
			meta := s.parsePacket(packet)

			// Stream to WebSocket
			if err := conn.WriteJSON(meta); err != nil {
				log.Println("WebSocket write error:", err)
				return nil // Stop capture on disconnect
			}
		}
	}
}

func (s *Service) parsePacket(packet gopacket.Packet) PacketMetadata {
	meta := PacketMetadata{
		Timestamp: packet.Metadata().Timestamp.Format("15:04:05.000"),
		Length:    packet.Metadata().Length,
		Protocol:  "UNKNOWN",
	}

	// Layer 3 (IP)
	if ipLayer := packet.Layer(layers.LayerTypeIPv4); ipLayer != nil {
		ip, _ := ipLayer.(*layers.IPv4)
		meta.SrcIP = ip.SrcIP.String()
		meta.DstIP = ip.DstIP.String()
		meta.Protocol = ip.Protocol.String()
	}

	// Layer 4 (TCP/UDP)
	if tcpLayer := packet.Layer(layers.LayerTypeTCP); tcpLayer != nil {
		tcp, _ := tcpLayer.(*layers.TCP)
		meta.Info = fmt.Sprintf("SrcPort: %d -> DstPort: %d (Seq: %d)", tcp.SrcPort, tcp.DstPort, tcp.Seq)
	} else if udpLayer := packet.Layer(layers.LayerTypeUDP); udpLayer != nil {
		udp, _ := udpLayer.(*layers.UDP)
		meta.Info = fmt.Sprintf("SrcPort: %d -> DstPort: %d", udp.SrcPort, udp.DstPort)
	}

	return meta
}
