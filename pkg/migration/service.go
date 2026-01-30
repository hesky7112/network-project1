package migration

import (
	"context"
	"fmt"
	"networking-main/pkg/provisioning"
	"sync"
	"time"

	"gorm.io/gorm"
)

type JobStatus struct {
	ID           string `json:"id"`
	Status       string `json:"status"` // "processing", "completed", "failed"
	Progress     int    `json:"progress"`
	Total        int    `json:"total"`
	SuccessCount int    `json:"success_count"`
	FailureCount int    `json:"failure_count"`
	Source       string `json:"source"`
	ErrorLog     string `json:"error_log"`
}

type Service struct {
	db           *gorm.DB
	provisioning *provisioning.Service
	jobs         map[string]*JobStatus
	mu           sync.RWMutex
}

func NewService(db *gorm.DB, prov *provisioning.Service) *Service {
	return &Service{
		db:           db,
		provisioning: prov,
		jobs:         make(map[string]*JobStatus),
	}
}

func (s *Service) StartMigration(ctx context.Context, sourceType string, config map[string]interface{}) (string, error) {
	s.mu.Lock()
	jobID := fmt.Sprintf("job_%d", len(s.jobs)+1)
	job := &JobStatus{
		ID:     jobID,
		Status: "processing",
		Source: sourceType,
	}
	s.jobs[jobID] = job
	s.mu.Unlock()

	// Run migration in background
	go s.runMigration(jobID, sourceType, config)

	return jobID, nil
}

func (s *Service) GetJobStatus(jobID string) (*JobStatus, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	job, ok := s.jobs[jobID]
	return job, ok
}

func (s *Service) runMigration(jobID string, _ string, _ map[string]interface{}) {
	// Simulated migration logic
	// In real production, this would parse CSV or call Mikrotik API
	total := 100

	s.mu.Lock()
	if job, ok := s.jobs[jobID]; ok {
		job.Total = total
	}
	s.mu.Unlock()

	for i := 1; i <= total; i++ {
		time.Sleep(50 * time.Millisecond) // Simulate work

		s.mu.Lock()
		if job, ok := s.jobs[jobID]; ok {
			job.Progress = (i * 100) / total
			job.SuccessCount++
		}
		s.mu.Unlock()
	}

	s.mu.Lock()
	if job, ok := s.jobs[jobID]; ok {
		job.Status = "completed"
	}
	s.mu.Unlock()
}
