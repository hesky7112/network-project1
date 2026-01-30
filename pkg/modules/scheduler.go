package modules

import (
	"log"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

// Scheduler manages automated module execution
type Scheduler struct {
	db      *gorm.DB
	spawner *Spawner
	stopCh  chan struct{}
}

// NewScheduler creates a new scheduler instance
func NewScheduler(db *gorm.DB, spawner *Spawner) *Scheduler {
	return &Scheduler{
		db:      db,
		spawner: spawner,
		stopCh:  make(chan struct{}),
	}
}

// Start begins the scheduling loop
func (s *Scheduler) Start() {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for {
			select {
			case <-ticker.C:
				s.processJobs()
			case <-s.stopCh:
				ticker.Stop()
				return
			}
		}
	}()
}

// Stop halts the scheduler
func (s *Scheduler) Stop() {
	close(s.stopCh)
}

// processJobs finds and executes due jobs
func (s *Scheduler) processJobs() {
	var jobs []ScheduledJob
	now := time.Now()

	// Find due jobs
	if err := s.db.Where("is_enabled = ? AND next_run_at <= ?", true, now).Find(&jobs).Error; err != nil {
		log.Printf("Scheduler Error: Failed to fetch jobs: %v", err)
		return
	}

	for _, job := range jobs {
		// Execute Module
		go func(j ScheduledJob) {
			s.executeJob(j)
		}(job)

		// Calculate Next Run
		nextRun := calculateNextRun(job.Schedule, now)

		// Update DB
		s.db.Model(&job).Updates(map[string]interface{}{
			"last_run_at": now,
			"next_run_at": nextRun,
		})
	}
}

func (s *Scheduler) executeJob(job ScheduledJob) {
	req := &ExecutionRequest{
		UserID:        job.UserID,
		ModuleID:      job.ModuleID,
		ExecutionMode: ExecutionServer, // Auto-jobs always run on server
		Input:         job.Input,
	}

	// We don't really care about the response for automated jobs,
	// but we should log errors. The spawner logs to ExecutionLog table already.
	_, err := s.spawner.Execute(req)
	if err != nil {
		log.Printf("Scheduler: Job %d (Module %s) failed: %v", job.ID, job.ModuleID, err)
	}
}

// calculateNextRun computes the next schedule time
// Supports:
// - Go Duration strings: "10m", "1h30m" -> runs every X from now
// - Simple Cron (Minutes): "*/5 * * * *" -> runs at :00, :05, :10...
func calculateNextRun(schedule string, lastRun time.Time) time.Time {
	// 1. Try ParseDuration (Simple Interval)
	if d, err := time.ParseDuration(schedule); err == nil {
		return lastRun.Add(d)
	}

	// 2. Try Simple Cron (*/N minutes only for Phase 1)
	// Format: "*/N * * * *"
	if strings.HasPrefix(schedule, "*/") {
		parts := strings.Split(schedule, " ")
		if len(parts) >= 1 {
			minPart := parts[0] // "*/5"
			if valStr := strings.TrimPrefix(minPart, "*/"); valStr != "" {
				if interval, err := strconv.Atoi(valStr); err == nil && interval > 0 {
					// Round up to next interval
					// e.g. now=10:03, interval=5 -> 10:05
					truncate := time.Duration(interval) * time.Minute
					next := lastRun.Truncate(truncate).Add(truncate)
					if next.Before(lastRun) {
						next = next.Add(truncate)
					}
					return next
				}
			}
		}
	}

	// Default fallback: 1 hour if parse fails (prevent tight loop)
	return lastRun.Add(1 * time.Hour)
}
