package migration

import (
	"context"
	"fmt"
	"networking-main/pkg/provisioning"
	"sync"

	"gorm.io/gorm"
)

// Migrator defines the interface for different migration source types (CSV, API, etc.)
type Migrator interface {
	Migrate(ctx context.Context, job *JobStatus, config map[string]interface{}) error
	GetName() string
}

type JobStatus struct {
	ID           string `json:"id"`
	Status       string `json:"status"` // "processing", "completed", "failed"
	Progress     int    `json:"progress"`
	Total        int    `json:"total"`
	SuccessCount int    `json:"success_count"`
	FailureCount int    `json:"failure_count"`
	Source       string `json:"source"`
	ErrorLog     string `json:"error_log"`
	mu           sync.Mutex
}

func (j *JobStatus) UpdateProgress(progress, success, failure int) {
	j.mu.Lock()
	defer j.mu.Unlock()
	j.Progress = progress
	j.SuccessCount = success
	j.FailureCount = failure
}

func (j *JobStatus) LogError(err string) {
	j.mu.Lock()
	defer j.mu.Unlock()
	if j.ErrorLog != "" {
		j.ErrorLog += "\n"
	}
	j.ErrorLog += err
}

type Service struct {
	db           *gorm.DB
	provisioning *provisioning.Service
	jobs         map[string]*JobStatus
	migrators    map[string]Migrator
	mu           sync.RWMutex
}

func NewService(db *gorm.DB, prov *provisioning.Service) *Service {
	s := &Service{
		db:           db,
		provisioning: prov,
		jobs:         make(map[string]*JobStatus),
		migrators:    make(map[string]Migrator),
	}
	return s
}

func (s *Service) RegisterMigrator(name string, m Migrator) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.migrators[name] = m
}

func (s *Service) StartMigration(ctx context.Context, sourceType string, config map[string]interface{}) (string, error) {
	s.mu.RLock()
	migrator, ok := s.migrators[sourceType]
	s.mu.RUnlock()

	if !ok {
		return "", fmt.Errorf("migrator for source type %s not registered", sourceType)
	}

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
	go func() {
		err := migrator.Migrate(ctx, job, config)
		s.mu.Lock()
		defer s.mu.Unlock()
		if err != nil {
			job.Status = "failed"
			job.LogError(err.Error())
		} else {
			job.Status = "completed"
		}
	}()

	return jobID, nil
}

func (s *Service) GetJobStatus(jobID string) (*JobStatus, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	job, ok := s.jobs[jobID]
	return job, ok
}
