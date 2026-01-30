package aiops

import (
	"context"
	"math"
	"networking-main/internal/models"
	"time"

	"gorm.io/gorm"
)

type Service struct {
	db                *gorm.DB
	CapacityPlanner   *CapacityPlanner
	RemediationEngine *RemediationEngine
	FluxReservoir     *FluxReservoir
	RemediationBandit *RemediationBandit
}

func NewService(db *gorm.DB) *Service {
	// Note: configService and neuralService need to be injected later or handled carefully
	return &Service{
		db:                db,
		CapacityPlanner:   NewCapacityPlanner(db),
		RemediationEngine: NewRemediationEngine(db, nil, nil),
		FluxReservoir:     NewFluxReservoir(100), // 100 neuron reservoir
		RemediationBandit: NewRemediationBandit(),
	}
}

// Stats represents basic statistical metrics
type Stats struct {
	Mean   float64
	StdDev float64
}

// CalculateStats computes mean and standard deviation for a slice of data
func CalculateStats(data []float64) Stats {
	if len(data) == 0 {
		return Stats{}
	}
	var sum float64
	for _, v := range data {
		sum += v
	}
	mean := sum / float64(len(data))

	var squaredDiffSum float64
	for _, v := range data {
		squaredDiffSum += math.Pow(v-mean, 2)
	}
	stdDev := math.Sqrt(squaredDiffSum / float64(len(data)))

	return Stats{Mean: mean, StdDev: stdDev}
}

// DetectAnomalies identifies telemetry points that deviate significantly from the mean
func (s *Service) DetectAnomalies(ctx context.Context, deviceID uint, metric string) ([]models.TelemetryData, error) {
	var history []models.TelemetryData
	// Get last 100 points for baseline
	err := s.db.Where("device_id = ? AND metric = ?", deviceID, metric).
		Order("timestamp DESC").Limit(100).Find(&history).Error
	if err != nil {
		return nil, err
	}

	if len(history) < 10 {
		return nil, nil // Not enough data for baseline
	}

	var values []float64
	for _, h := range history {
		values = append(values, h.Value)
	}

	stats := CalculateStats(values)
	threshold := 3.0 // 3 Sigma rule

	var anomalies []models.TelemetryData
	for _, h := range history {
		zScore := math.Abs(h.Value-stats.Mean) / stats.StdDev
		if zScore > threshold {
			anomalies = append(anomalies, h)
		}
	}

	return anomalies, nil
}

// PredictChurn identifiers users at risk based on latency and ticket history
func (s *Service) PredictChurn(ctx context.Context, userID uint) (float64, string, error) {
	// 1. Check latency stability (Standard Deviation of pings)
	var telemetry []models.TelemetryData
	s.db.Where("metric = ? AND created_at > ?", "latency", time.Now().AddDate(0, 0, -7)).
		Find(&telemetry) // Simplified - real query would filter by user's IP/device

	var values []float64
	for _, t := range telemetry {
		values = append(values, t.Value)
	}
	stats := CalculateStats(values)

	// 2. Score calculation (Proprietary "Alien" logic 👽)
	score := 0.0
	reason := "Healthy"

	if stats.StdDev > 50 { // High jitter
		score += 0.4
		reason = "High Latency Jitter"
	}

	// 3. Check for repeated tickets
	var ticketCount int64
	s.db.Table("tickets").Where("user_id = ? AND created_at > ?", userID, time.Now().AddDate(0, 0, -30)).Count(&ticketCount)
	if ticketCount > 3 {
		score += 0.5
		reason = "Too many support tickets"
	}

	if score > 0.8 {
		reason = "Critical Churn Risk"
	} else if score > 0.5 {
		reason = "Moderate Churn Risk"
	}

	return math.Min(score, 1.0), reason, nil
}

// UpdateReservoir feeds current telemetry into the non-linear reservoir
func (s *Service) UpdateReservoir(value float64) {
	s.FluxReservoir.Tick(value)
	s.FluxReservoir.Train(value)
}

// PredictFlux projects future traffic using the Echo State Reservoir
func (s *Service) PredictFlux(steps int) []float64 {
	return s.FluxReservoir.Forecast(steps)
}
