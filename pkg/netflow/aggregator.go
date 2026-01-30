package netflow

import (
	"fmt"
	"log"
	"sync"
	"time"

	"gorm.io/gorm"
)

// TrafficStats represents aggregated flow records
// This is what we actually store in the DB to avoid explosive growth
type TrafficStats struct {
	ID       uint      `gorm:"primaryKey" json:"id"`
	TimeWin  time.Time `json:"time_window" gorm:"index"` // Truncated to minute
	SrcIP    string    `json:"src_ip"`
	DstIP    string    `json:"dst_ip"`
	App      string    `json:"app"` // HTTP, SSH, etc.
	Protocol int       `json:"protocol"`
	Bytes    int64     `json:"bytes"`
	Packets  int64     `json:"packets"`
	Count    int       `json:"flow_count"`
}

type Aggregator struct {
	db     *gorm.DB
	cache  map[string]*TrafficStats
	mu     sync.Mutex
	quit   chan bool
	ticker *time.Ticker
}

func NewAggregator(db *gorm.DB) *Aggregator {
	return &Aggregator{
		db:    db,
		cache: make(map[string]*TrafficStats),
	}
}

func (a *Aggregator) Start() {
	a.quit = make(chan bool)
	a.ticker = time.NewTicker(1 * time.Minute)

	go func() {
		for {
			select {
			case <-a.ticker.C:
				a.Flush()
			case <-a.quit:
				a.Flush()
				return
			}
		}
	}()
	log.Println("🌊 [NetFlow] Aggregator started (1m intervals)")
}

func (a *Aggregator) Stop() {
	if a.ticker != nil {
		a.ticker.Stop()
	}
	if a.quit != nil {
		a.quit <- true
	}
}

// Ingest adds a raw flow to the current aggregation window
// It is non-blocking to the collector logic (unless mapped lock contention)
func (a *Aggregator) Ingest(flow FlowRecord) {
	a.mu.Lock()
	defer a.mu.Unlock()

	// Determine Time Window (truncate to minute)
	win := flow.Timestamp.Truncate(time.Minute)

	// Determine App (Port Mapper)
	app := resolveApp(flow.DstPort, flow.SrcPort)

	// Create Key: Time|Src|Dst|App|Proto
	key := fmt.Sprintf("%d|%s|%s|%s|%d", win.Unix(), flow.SrcIP, flow.DstIP, app, flow.Protocol)

	if _, exists := a.cache[key]; !exists {
		a.cache[key] = &TrafficStats{
			TimeWin:  win,
			SrcIP:    flow.SrcIP,
			DstIP:    flow.DstIP,
			App:      app,
			Protocol: flow.Protocol,
		}
	}

	// Update Stats
	stats := a.cache[key]
	stats.Bytes += int64(flow.Bytes)
	stats.Packets += int64(flow.Packets)
	stats.Count++
}

func (a *Aggregator) Flush() {
	a.mu.Lock()
	if len(a.cache) == 0 {
		a.mu.Unlock()
		return
	}

	// Swap cache
	currentCache := a.cache
	a.cache = make(map[string]*TrafficStats)
	a.mu.Unlock()

	// Batch Insert (GORM v2 handles batching nicely)
	var batch []TrafficStats
	for _, stats := range currentCache {
		batch = append(batch, *stats)
	}

	// Write to DB in chunks
	result := a.db.CreateInBatches(batch, 100)
	if result.Error != nil {
		log.Printf("❌ [NetFlow] Aggregation Flush Failed: %v", result.Error)
	} else {
		log.Printf("🌊 [NetFlow] Flushed %d aggregated records", len(batch))
	}
}

// resolveApp maps ports to unknown app names
func resolveApp(dstPort, srcPort int) string {
	// Check Destination first (server side usually)
	if name, ok := commonPorts[dstPort]; ok {
		return name
	}
	// Check Source (rare, but sometimes needed)
	if name, ok := commonPorts[srcPort]; ok {
		return name
	}
	return "unknown"
}

var commonPorts = map[int]string{
	20:   "FTP",
	21:   "FTP",
	22:   "SSH",
	23:   "Telnet",
	25:   "SMTP",
	53:   "DNS",
	80:   "HTTP",
	123:  "NTP",
	443:  "HTTPS",
	1433: "MSSQL",
	3306: "MySQL",
	5432: "PostgreSQL",
	8080: "HTTP-Alt",
}
