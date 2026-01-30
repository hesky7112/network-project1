package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// JobType represents the type of job
type JobType string

const (
	JobTypeDiscovery    JobType = "discovery"
	JobTypeBackup       JobType = "backup"
	JobTypeCompliance   JobType = "compliance"
	JobTypeProvisioning JobType = "provisioning"
	JobTypeRemediation  JobType = "remediation"
	JobTypeAnalytics    JobType = "analytics"
)

// JobStatus represents the status of a job
type JobStatus string

const (
	JobStatusPending   JobStatus = "pending"
	JobStatusRunning   JobStatus = "running"
	JobStatusCompleted JobStatus = "completed"
	JobStatusFailed    JobStatus = "failed"
	JobStatusCancelled JobStatus = "cancelled"
)

// Job represents an asynchronous job
type Job struct {
	ID          string                 `json:"id" gorm:"primaryKey"`
	Type        JobType                `json:"type"`
	Status      JobStatus              `json:"status"`
	Payload     json.RawMessage        `json:"payload" gorm:"type:jsonb"`
	Result      json.RawMessage        `json:"result" gorm:"type:jsonb"`
	Error       string                 `json:"error"`
	Progress    int                    `json:"progress"` // 0-100
	CreatedAt   time.Time              `json:"created_at"`
	StartedAt   *time.Time             `json:"started_at"`
	CompletedAt *time.Time             `json:"completed_at"`
	CreatedBy   string                 `json:"created_by"`
	Priority    int                    `json:"priority"` // Higher number = higher priority
	Metadata    map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
}

// JobQueue manages asynchronous job execution
type JobQueue struct {
	db          *gorm.DB
	jobs        chan *Job
	workers     int
	workerPool  []*Worker
	mutex       sync.RWMutex
	ctx         context.Context
	cancel      context.CancelFunc
	handlers    map[JobType]JobHandler
}

// JobHandler is a function that processes a job
type JobHandler func(ctx context.Context, job *Job) error

// Worker represents a job worker
type Worker struct {
	ID       int
	queue    *JobQueue
	jobsChan chan *Job
	quit     chan bool
}

// NewJobQueue creates a new job queue
func NewJobQueue(db *gorm.DB, workers int) *JobQueue {
	ctx, cancel := context.WithCancel(context.Background())
	
	jq := &JobQueue{
		db:       db,
		jobs:     make(chan *Job, 1000), // Buffer for 1000 jobs
		workers:  workers,
		ctx:      ctx,
		cancel:   cancel,
		handlers: make(map[JobType]JobHandler),
	}

	return jq
}

// RegisterHandler registers a handler for a job type
func (jq *JobQueue) RegisterHandler(jobType JobType, handler JobHandler) {
	jq.mutex.Lock()
	defer jq.mutex.Unlock()
	jq.handlers[jobType] = handler
}

// StartWorkers starts the worker pool
func (jq *JobQueue) StartWorkers() {
	jq.workerPool = make([]*Worker, jq.workers)
	
	for i := 0; i < jq.workers; i++ {
		worker := &Worker{
			ID:       i + 1,
			queue:    jq,
			jobsChan: jq.jobs,
			quit:     make(chan bool),
		}
		jq.workerPool[i] = worker
		go worker.Start()
	}

	// Start job dispatcher
	go jq.dispatchJobs()

	fmt.Printf("Started %d workers for job queue\n", jq.workers)
}

// StopWorkers stops all workers
func (jq *JobQueue) StopWorkers() {
	jq.cancel()
	
	for _, worker := range jq.workerPool {
		worker.quit <- true
	}
	
	close(jq.jobs)
}

// Enqueue adds a job to the queue
func (jq *JobQueue) Enqueue(jobType JobType, payload interface{}, createdBy string, priority int) (string, error) {
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal payload: %w", err)
	}

	job := &Job{
		ID:        uuid.New().String(),
		Type:      jobType,
		Status:    JobStatusPending,
		Payload:   payloadJSON,
		CreatedAt: time.Now(),
		CreatedBy: createdBy,
		Priority:  priority,
		Progress:  0,
	}

	// Save to database
	if err := jq.db.Create(job).Error; err != nil {
		return "", fmt.Errorf("failed to create job: %w", err)
	}

	// Add to queue
	select {
	case jq.jobs <- job:
		return job.ID, nil
	case <-time.After(5 * time.Second):
		return "", fmt.Errorf("job queue is full")
	}
}

// EnqueueDiscovery enqueues a network discovery job
func (jq *JobQueue) EnqueueDiscovery(ipRange string, createdBy string) (string, error) {
	payload := map[string]interface{}{
		"ip_range": ipRange,
		"scan_type": "full",
	}
	return jq.Enqueue(JobTypeDiscovery, payload, createdBy, 5)
}

// EnqueueBackup enqueues a configuration backup job
func (jq *JobQueue) EnqueueBackup(deviceIDs []uint, createdBy string) (string, error) {
	payload := map[string]interface{}{
		"device_ids": deviceIDs,
	}
	return jq.Enqueue(JobTypeBackup, payload, createdBy, 7)
}

// EnqueueCompliance enqueues a compliance check job
func (jq *JobQueue) EnqueueCompliance(deviceIDs []uint, policies []string, createdBy string) (string, error) {
	payload := map[string]interface{}{
		"device_ids": deviceIDs,
		"policies":   policies,
	}
	return jq.Enqueue(JobTypeCompliance, payload, createdBy, 8)
}

// GetJobStatus retrieves the status of a job
func (jq *JobQueue) GetJobStatus(jobID string) (*Job, error) {
	var job Job
	if err := jq.db.Where("id = ?", jobID).First(&job).Error; err != nil {
		return nil, err
	}
	return &job, nil
}

// ListJobs lists jobs with filters
func (jq *JobQueue) ListJobs(status JobStatus, jobType JobType, limit int) ([]Job, error) {
	var jobs []Job
	query := jq.db.Order("created_at DESC")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if jobType != "" {
		query = query.Where("type = ?", jobType)
	}
	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&jobs).Error; err != nil {
		return nil, err
	}

	return jobs, nil
}

// CancelJob cancels a pending job
func (jq *JobQueue) CancelJob(jobID string) error {
	return jq.db.Model(&Job{}).
		Where("id = ? AND status = ?", jobID, JobStatusPending).
		Update("status", JobStatusCancelled).Error
}

// UpdateJobProgress updates the progress of a running job
func (jq *JobQueue) UpdateJobProgress(jobID string, progress int) error {
	return jq.db.Model(&Job{}).
		Where("id = ?", jobID).
		Update("progress", progress).Error
}

// dispatchJobs continuously dispatches pending jobs from database to queue
func (jq *JobQueue) dispatchJobs() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-jq.ctx.Done():
			return
		case <-ticker.C:
			// Fetch pending jobs from database
			var pendingJobs []Job
			err := jq.db.Where("status = ?", JobStatusPending).
				Order("priority DESC, created_at ASC").
				Limit(10).
				Find(&pendingJobs).Error

			if err != nil {
				fmt.Printf("Error fetching pending jobs: %v\n", err)
				continue
			}

			// Dispatch to workers
			for i := range pendingJobs {
				select {
				case jq.jobs <- &pendingJobs[i]:
					// Job dispatched
				case <-jq.ctx.Done():
					return
				default:
					// Queue full, will retry next tick
				}
			}
		}
	}
}

// Worker methods

// Start starts the worker
func (w *Worker) Start() {
	fmt.Printf("Worker %d started\n", w.ID)
	
	for {
		select {
		case job := <-w.jobsChan:
			w.processJob(job)
		case <-w.quit:
			fmt.Printf("Worker %d stopped\n", w.ID)
			return
		}
	}
}

// processJob processes a single job
func (w *Worker) processJob(job *Job) {
	fmt.Printf("Worker %d processing job %s (type: %s)\n", w.ID, job.ID, job.Type)

	// Update job status to running
	now := time.Now()
	job.Status = JobStatusRunning
	job.StartedAt = &now
	w.queue.db.Save(job)

	// Get handler
	w.queue.mutex.RLock()
	handler, exists := w.queue.handlers[job.Type]
	w.queue.mutex.RUnlock()

	if !exists {
		job.Status = JobStatusFailed
		job.Error = fmt.Sprintf("no handler registered for job type: %s", job.Type)
		completed := time.Now()
		job.CompletedAt = &completed
		w.queue.db.Save(job)
		return
	}

	// Execute handler
	ctx, cancel := context.WithTimeout(w.queue.ctx, 30*time.Minute)
	defer cancel()

	err := handler(ctx, job)
	
	// Update job status
	completed := time.Now()
	job.CompletedAt = &completed
	
	if err != nil {
		job.Status = JobStatusFailed
		job.Error = err.Error()
		fmt.Printf("Worker %d: Job %s failed: %v\n", w.ID, job.ID, err)
	} else {
		job.Status = JobStatusCompleted
		job.Progress = 100
		fmt.Printf("Worker %d: Job %s completed successfully\n", w.ID, job.ID)
	}

	w.queue.db.Save(job)
}

// JobResult represents the result of a job
type JobResult struct {
	Success bool                   `json:"success"`
	Data    interface{}            `json:"data"`
	Message string                 `json:"message"`
	Errors  []string               `json:"errors,omitempty"`
	Metrics map[string]interface{} `json:"metrics,omitempty"`
}

// SetJobResult sets the result of a job
func (jq *JobQueue) SetJobResult(jobID string, result *JobResult) error {
	resultJSON, err := json.Marshal(result)
	if err != nil {
		return err
	}

	return jq.db.Model(&Job{}).
		Where("id = ?", jobID).
		Update("result", resultJSON).Error
}

// GetJobResult retrieves the result of a completed job
func (jq *JobQueue) GetJobResult(jobID string) (*JobResult, error) {
	var job Job
	if err := jq.db.Where("id = ?", jobID).First(&job).Error; err != nil {
		return nil, err
	}

	if job.Status != JobStatusCompleted {
		return nil, fmt.Errorf("job is not completed yet (status: %s)", job.Status)
	}

	var result JobResult
	if err := json.Unmarshal(job.Result, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// CleanupOldJobs removes completed jobs older than the specified duration
func (jq *JobQueue) CleanupOldJobs(olderThan time.Duration) error {
	cutoff := time.Now().Add(-olderThan)
	
	result := jq.db.Where("status IN ? AND completed_at < ?", 
		[]JobStatus{JobStatusCompleted, JobStatusFailed, JobStatusCancelled}, 
		cutoff).
		Delete(&Job{})

	if result.Error != nil {
		return result.Error
	}

	fmt.Printf("Cleaned up %d old jobs\n", result.RowsAffected)
	return nil
}

// GetQueueStats returns statistics about the job queue
func (jq *JobQueue) GetQueueStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Count by status
	var statusCounts []struct {
		Status JobStatus
		Count  int64
	}
	jq.db.Model(&Job{}).
		Select("status, count(*) as count").
		Group("status").
		Scan(&statusCounts)

	statusMap := make(map[string]int64)
	for _, sc := range statusCounts {
		statusMap[string(sc.Status)] = sc.Count
	}
	stats["by_status"] = statusMap

	// Count by type
	var typeCounts []struct {
		Type  JobType
		Count int64
	}
	jq.db.Model(&Job{}).
		Select("type, count(*) as count").
		Group("type").
		Scan(&typeCounts)

	typeMap := make(map[string]int64)
	for _, tc := range typeCounts {
		typeMap[string(tc.Type)] = tc.Count
	}
	stats["by_type"] = typeMap

	// Average completion time
	var avgTime float64
	jq.db.Model(&Job{}).
		Where("status = ? AND completed_at IS NOT NULL", JobStatusCompleted).
		Select("AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))").
		Scan(&avgTime)
	stats["avg_completion_time_seconds"] = avgTime

	// Queue size
	stats["queue_size"] = len(jq.jobs)
	stats["worker_count"] = jq.workers

	return stats, nil
}
