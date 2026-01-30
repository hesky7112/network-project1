package telemetry

import (
	"math"
	"sort"
	"time"

	"networking-main/internal/models"

	"gorm.io/gorm"
)

type BandwidthAnalyzer struct {
	db *gorm.DB
}

func NewBandwidthAnalyzer(db *gorm.DB) *BandwidthAnalyzer {
	return &BandwidthAnalyzer{db: db}
}

type BandwidthUsage struct {
	DeviceID        uint      `json:"device_id"`
	Interface       string    `json:"interface"`
	TotalIn         int64     `json:"total_in_bytes"`
	TotalOut        int64     `json:"total_out_bytes"`
	Percentile95In  float64   `json:"percentile_95_in_bps"`
	Percentile95Out float64   `json:"percentile_95_out_bps"`
	StartTime       time.Time `json:"start_time"`
	EndTime         time.Time `json:"end_time"`
}

// CalculateBandwidthUsage calculates total usage and 95th percentile for a given period
func (ba *BandwidthAnalyzer) CalculateUsage(deviceID uint, iface string, start, end time.Time) (*BandwidthUsage, error) {
	var metrics []models.TelemetryData

	// Fetch InOctets and OutOctets
	err := ba.db.Where("device_id = ? AND metric IN ? AND timestamp BETWEEN ? AND ?",
		deviceID, []string{"ifHCInOctets", "ifHCOutOctets"}, start, end).
		Order("timestamp ASC").Find(&metrics).Error

	if err != nil {
		return nil, err
	}

	// Separate In and Out samples
	// Note: We need to calculate delta/rate from Octets counters for 95th percentile
	// This assumes valid counter data points.

	inRates := []float64{}
	outRates := []float64{}

	var lastIn, lastOut *models.TelemetryData
	totalIn := int64(0)
	totalOut := int64(0)

	for _, m := range metrics {
		if m.Metric == "ifHCInOctets" {
			if lastIn != nil {
				delta := int64(m.Value) - int64(lastIn.Value)
				duration := m.Timestamp.Sub(lastIn.Timestamp).Seconds()
				if delta >= 0 && duration > 0 {
					totalIn += delta
					rate := float64(delta) * 8 / duration // bps
					inRates = append(inRates, rate)
				}
			}
			val := m
			lastIn = &val
		} else if m.Metric == "ifHCOutOctets" {
			if lastOut != nil {
				delta := int64(m.Value) - int64(lastOut.Value)
				duration := m.Timestamp.Sub(lastOut.Timestamp).Seconds()
				if delta >= 0 && duration > 0 {
					totalOut += delta
					rate := float64(delta) * 8 / duration // bps
					outRates = append(outRates, rate)
				}
			}
			val := m
			lastOut = &val
		}
	}

	return &BandwidthUsage{
		DeviceID:        deviceID,
		Interface:       iface,
		TotalIn:         totalIn,
		TotalOut:        totalOut,
		Percentile95In:  calculate95th(inRates),
		Percentile95Out: calculate95th(outRates),
		StartTime:       start,
		EndTime:         end,
	}, nil
}

func calculate95th(rates []float64) float64 {
	if len(rates) == 0 {
		return 0
	}
	sort.Float64s(rates)
	index := int(math.Ceil(float64(len(rates)) * 0.95))
	if index >= len(rates) {
		index = len(rates) - 1
	}
	return rates[index]
}
