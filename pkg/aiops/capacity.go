package aiops

import (
	"errors"
	"math"
	"time"

	"networking-main/internal/models"

	"gorm.io/gorm"
)

type CapacityPlanner struct {
	db *gorm.DB
}

type CapacityForecast struct {
	DeviceID         uint    `json:"device_id"`
	Interface        string  `json:"interface"`
	CurrentUsage     float64 `json:"current_usage_bps"`
	PredictedUsage   float64 `json:"predicted_usage_bps_30d"`
	DaysToSaturation int     `json:"days_to_saturation"`
	Confidence       float64 `json:"confidence_score"`
}

func NewCapacityPlanner(db *gorm.DB) *CapacityPlanner {
	return &CapacityPlanner{db: db}
}

// ForecastBandwidth predicts future bandwidth usage using linear regression
func (cp *CapacityPlanner) ForecastBandwidth(deviceID uint, iface string, capacityBps float64) (*CapacityForecast, error) {
	// 1. Fetch historical data (last 30 days)
	var history []models.TelemetryData
	since := time.Now().AddDate(0, 0, -30)

	// Use InOctets for calculation (converted to bps)
	err := cp.db.Where("device_id = ? AND metric = ? AND timestamp > ?",
		deviceID, "ifHCInOctets", since).Order("timestamp ASC").Find(&history).Error

	if err != nil {
		return nil, err
	}

	if len(history) < 2 {
		return nil, errors.New("insufficient data for forecasting")
	}

	// 2. Prepare data points (Time (x), Rate (y))
	var points []Point
	var lastVal *models.TelemetryData

	for i := range history {
		curr := &history[i]
		if lastVal != nil {
			deltaInfo := curr.Value - lastVal.Value // simple float diff
			deltaDuration := curr.Timestamp.Sub(lastVal.Timestamp).Seconds()

			if deltaInfo >= 0 && deltaDuration > 0 {
				rate := (deltaInfo * 8) / deltaDuration // bps
				// X = hours since start
				x := curr.Timestamp.Sub(since).Hours()
				points = append(points, Point{X: x, Y: rate})
			}
		}
		lastVal = curr
	}

	if len(points) == 0 {
		return nil, errors.New("no valid rate points calculated")
	}

	// 3. Perform Linear Regression
	slope, intercept := linearRegression(points)

	// 4. Forecast 30 days ahead (current time + 30 days = 60 days from start window)
	hoursNow := time.Since(since).Hours()
	hoursFuture := hoursNow + (30 * 24)

	currentUsage := (slope * hoursNow) + intercept
	predictedUsage := (slope * hoursFuture) + intercept

	// 5. Calculate Saturation
	daysToSat := -1 // Never
	if slope > 0 {
		// capacity = slope * hours + intercept
		// hours = (capacity - intercept) / slope
		hoursToSat := (capacityBps - intercept) / slope
		hoursFromNow := hoursToSat - hoursNow
		if hoursFromNow > 0 {
			daysToSat = int(math.Ceil(hoursFromNow / 24))
		} else if currentUsage > capacityBps {
			daysToSat = 0 // Already saturated
		}
	}

	return &CapacityForecast{
		DeviceID:         deviceID,
		Interface:        iface,
		CurrentUsage:     currentUsage,
		PredictedUsage:   predictedUsage,
		DaysToSaturation: daysToSat,
		Confidence:       0.85, // Placeholder for R-squared
	}, nil
}

type Point struct {
	X, Y float64
}

func linearRegression(points []Point) (slope, intercept float64) {
	n := float64(len(points))
	sumX, sumY, sumXY, sumXX := 0.0, 0.0, 0.0, 0.0

	for _, p := range points {
		sumX += p.X
		sumY += p.Y
		sumXY += p.X * p.Y
		sumXX += p.X * p.X
	}

	slope = (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX)
	intercept = (sumY - slope*sumX) / n
	return slope, intercept
}
