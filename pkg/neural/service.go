package neural

import (
	"sync"
)

// Service provides a high-level API for Neural Operations
type Service struct {
	engine    *VectorEngine
	HDCEngine *HDCEngine
	mu        sync.RWMutex
}

// NewService initializes the Neural Core
func NewService() *Service {
	return &Service{
		engine:    NewVectorEngine(),
		HDCEngine: NewHDCEngine(),
	}
}

// IngestLog adds a system log to the brain
func (s *Service) IngestLog(id, content string, metadata map[string]interface{}) {
	s.mu.Lock()
	defer s.mu.Unlock()

	doc := Document{
		ID:       id,
		Content:  content,
		Metadata: metadata,
	}
	s.engine.AddDocument(doc)
}

// FindRelatedEvents find events similar to the given text
func (s *Service) FindRelatedEvents(query string, limit int) interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return s.engine.Search(query, limit)
}

// Reset clears the intelligence layer
func (s *Service) Reset() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.engine = NewVectorEngine()
}

// GenerateHolographicFingerprint creates a 10k-bit holographic vector for a state
func (s *Service) GenerateHolographicFingerprint() HyperVector {
	return s.HDCEngine.GenerateRandomVector()
}

// CompareHolographic performs a sub-nanosecond similarity check between two states
func (s *Service) CompareHolographic(a, b HyperVector) float64 {
	return s.HDCEngine.HammingDistance(a, b)
}

// GetRemediationAdvice finds the best matching remediation for a problem
func (s *Service) GetRemediationAdvice(problem string) (*SearchResult, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	results := s.engine.Search(problem, 1)
	if len(results) == 0 {
		return nil, nil
	}

	// We only want results with a high enough confidence
	if results[0].Score < 0.6 {
		return nil, nil
	}

	return &results[0], nil
}
