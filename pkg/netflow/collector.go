package netflow

import (
	"bytes"
	"encoding/binary"
	"log"
	"net"
	"sync"
	"time"

	"gorm.io/gorm"
)

// NetFlow v5 Header
type HeaderV5 struct {
	Version      uint16
	Count        uint16
	SysUptime    uint32
	UnixSecs     uint32
	UnixNSecs    uint32
	FlowSequence uint32
	EngineType   uint8
	EngineID     uint8
	SamplingInt  uint16
}

// NetFlow v5 Record
type RecordV5 struct {
	SrcAddr  uint32
	DstAddr  uint32
	NextHop  uint32
	Input    uint16
	Output   uint16
	Pkts     uint32
	Octets   uint32
	First    uint32
	Last     uint32
	SrcPort  uint16
	DstPort  uint16
	Pad1     uint8
	TCPFlags uint8
	Prot     uint8
	ToS      uint8
	SrcAS    uint16
	DstAS    uint16
	SrcMask  uint8
	DstMask  uint8
	Pad2     uint16
}

// FlowRecord represents a stored flow in the DB (simplification)
type FlowRecord struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SrcIP     string    `json:"src_ip"`
	DstIP     string    `json:"dst_ip"`
	SrcPort   int       `json:"src_port"`
	DstPort   int       `json:"dst_port"`
	Protocol  int       `json:"protocol"`
	Bytes     int       `json:"bytes"`
	Packets   int       `json:"packets"`
	Timestamp time.Time `json:"timestamp"`
}

type Collector struct {
	db         *gorm.DB
	port       int
	conn       *net.UDPConn
	aggregator *Aggregator
	mu         sync.RWMutex
}

func NewCollector(db *gorm.DB, port int) *Collector {
	if port == 0 {
		port = 2055
	}
	agg := NewAggregator(db)
	return &Collector{
		db:         db,
		port:       port,
		aggregator: agg,
	}
}

func (c *Collector) Start() error {
	addr := net.UDPAddr{
		Port: c.port,
		IP:   net.ParseIP("0.0.0.0"),
	}
	conn, err := net.ListenUDP("udp", &addr)
	if err != nil {
		return err
	}
	c.conn = conn

	// Start Aggregator
	c.aggregator.Start()

	log.Printf("🌊 [NetFlow] Collector listening on UDP %s", addr.String())

	go c.listenForPackets()
	return nil
}

func (c *Collector) listenForPackets() {
	buf := make([]byte, 8192) // jumbo frame safe
	for {
		// Check if stopped
		if c.conn == nil {
			return
		}

		n, _, err := c.conn.ReadFromUDP(buf)
		if err != nil {
			// Basic error handling for shutdown
			continue
		}
		c.processPacket(buf[:n])
	}
}

func (c *Collector) processPacket(data []byte) {
	reader := bytes.NewReader(data)

	// simple check for version
	var version uint16
	if err := binary.Read(reader, binary.BigEndian, &version); err != nil {
		return
	}

	// Reset reader to start
	reader.Seek(0, 0)

	if version == 5 {
		c.processV5(reader)
	} else {
		// Log but don't error spam for now, maybe v9 later
		// log.Printf("[NetFlow] Unsupported version: %d", version)
	}
}

func (c *Collector) processV5(reader *bytes.Reader) {
	var header HeaderV5
	if err := binary.Read(reader, binary.BigEndian, &header); err != nil {
		return
	}

	for i := 0; i < int(header.Count); i++ {
		var record RecordV5
		if err := binary.Read(reader, binary.BigEndian, &record); err != nil {
			break
		}

		flow := FlowRecord{
			SrcIP:     intToIP(record.SrcAddr),
			DstIP:     intToIP(record.DstAddr),
			SrcPort:   int(record.SrcPort),
			DstPort:   int(record.DstPort),
			Protocol:  int(record.Prot),
			Bytes:     int(record.Octets),
			Packets:   int(record.Pkts),
			Timestamp: time.Now(),
		}

		// Ingest into Aggregator (Non-blocking usually)
		c.aggregator.Ingest(flow)
	}
}

func intToIP(nn uint32) string {
	ip := make(net.IP, 4)
	binary.BigEndian.PutUint32(ip, nn)
	return ip.String()
}

func (c *Collector) Stop() {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn != nil {
		c.conn.Close()
		c.conn = nil
	}
	if c.aggregator != nil {
		c.aggregator.Stop()
	}
}

// GetTopTalkers returns the IPs using the most bandwidth
type TopTalker struct {
	IP         string `json:"ip"`
	TotalBytes int    `json:"total_bytes"`
}

func (c *Collector) GetTopTalkers(limit int) ([]TopTalker, error) {
	var results []TopTalker
	// Simplified SQL group by
	err := c.db.Model(&FlowRecord{}).
		Select("src_ip as ip, sum(bytes) as total_bytes").
		Group("src_ip").
		Order("total_bytes desc").
		Limit(limit).
		Scan(&results).Error
	return results, err
}
