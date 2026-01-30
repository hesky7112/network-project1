package scheduler

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"gorm.io/gorm"
)

// TaskType defines the category of the task
type TaskType string

const (
	TaskTypeBackup     TaskType = "backup"
	TaskTypeCompliance TaskType = "compliance"
	TaskTypeReport     TaskType = "report"
	TaskTypeDiscovery  TaskType = "discovery"
	TaskTypeCleanup    TaskType = "cleanup"
)

// TaskDefinition defines what needs to be run
type TaskDefinition struct {
	Name     string
	Type     TaskType
	Interval time.Duration
	Handler  func(ctx context.Context) error
	Enabled  bool
}

// TaskLog records execution history
type TaskLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TaskName  string    `json:"task_name"`
	Status    string    `json:"status"` // "success", "failure"
	Duration  string    `json:"duration"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}

type TaskInfo struct {
	Name     string        `json:"name"`
	Type     TaskType      `json:"type"`
	Interval time.Duration `json:"interval"`
	Enabled  bool          `json:"enabled"`
}

// Service manages scheduled tasks
type Service struct {
	db       *gorm.DB
	tasks    map[string]*TaskDefinition
	stopChan chan bool
	wg       sync.WaitGroup
	mu       sync.RWMutex
}

// NewService creates a new scheduler service
func NewService(db *gorm.DB) *Service {
	// Ensure migration (auto-migrate here or in main, usually safer here for module-specifics)
	// db.AutoMigrate(&TaskLog{}) // Assuming main does common migration, but good to ensure
	return &Service{
		db:       db,
		tasks:    make(map[string]*TaskDefinition),
		stopChan: make(chan bool),
	}
}

// RegisterTask adds a new task to the scheduler
func (s *Service) RegisterTask(name string, taskType TaskType, interval time.Duration, handler func(ctx context.Context) error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.tasks[name] = &TaskDefinition{
		Name:     name,
		Type:     taskType,
		Interval: interval,
		Handler:  handler,
		Enabled:  true,
	}
	log.Printf("Task registered: %s (Interval: %s)", name, interval)
}

// GetTasks returns list of registered tasks
func (s *Service) GetTasks() []TaskInfo {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var list []TaskInfo
	for _, t := range s.tasks {
		list = append(list, TaskInfo{
			Name:     t.Name,
			Type:     t.Type,
			Interval: t.Interval,
			Enabled:  t.Enabled,
		})
	}
	return list
}

// GetLogs returns execution history
func (s *Service) GetLogs(limit int) ([]TaskLog, error) {
	var logs []TaskLog
	err := s.db.Order("created_at desc").Limit(limit).Find(&logs).Error
	return logs, err
}

// TriggerTask manually executes a task
func (s *Service) TriggerTask(name string) error {
	s.mu.RLock()
	task, exists := s.tasks[name]
	s.mu.RUnlock()

	if !exists {
		return fmt.Errorf("task not found: %s", name)
	}

	go s.executeTask(task)
	return nil
}

// Start begins the scheduler
func (s *Service) Start() {
	s.mu.RLock()
	defer s.mu.RUnlock()

	// Ensure DB table exists
	s.db.AutoMigrate(&TaskLog{})

	log.Println("Starting Scheduler Service...")

	for _, task := range s.tasks {
		if task.Enabled {
			s.wg.Add(1)
			go s.runTaskLoop(task)
		}
	}
}

// Stop halts the scheduler
func (s *Service) Stop() {
	log.Println("Stopping Scheduler Service...")
	close(s.stopChan)
	s.wg.Wait()
	log.Println("Scheduler Service stopped")
}

func (s *Service) runTaskLoop(task *TaskDefinition) {
	defer s.wg.Done()

	log.Printf("Started loop for task: %s", task.Name)
	ticker := time.NewTicker(task.Interval)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopChan:
			return
		case <-ticker.C:
			s.executeTask(task)
		}
	}
}

func (s *Service) executeTask(task *TaskDefinition) {
	log.Printf("Executing task: %s", task.Name)

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
	defer cancel()

	start := time.Now()
	err := task.Handler(ctx)
	duration := time.Since(start)

	status := "success"
	msg := "Completed successfully"
	if err != nil {
		status = "failure"
		msg = err.Error()
		log.Printf("Task %s failed after %s: %v", task.Name, duration, err)
	} else {
		log.Printf("Task %s completed successfully in %s", task.Name, duration)
	}

	// Persist log
	s.db.Create(&TaskLog{
		TaskName:  task.Name,
		Status:    status,
		Duration:  duration.String(),
		Message:   msg,
		CreatedAt: time.Now(),
	})
}
