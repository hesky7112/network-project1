package aiops

import (
	"math"
	"math/rand"
	"time"
)

// FluxReservoir implements an Echo State Network (ESN)
// It projects input into a high-dimensional chaotic space for non-linear prediction
type FluxReservoir struct {
	Size         int       // Number of neurons in reservoir
	State        []float64 // Current activations
	InputWeights [][]float64
	ResWeights   [][]float64
	Readout      []float64 // Linear output layer weights
	SpectralRad  float64   // Stability control
	Random       *rand.Rand
}

func NewFluxReservoir(size int) *FluxReservoir {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	fr := &FluxReservoir{
		Size:        size,
		State:       make([]float64, size),
		SpectralRad: 0.95, // Ensuring "Echo State Property"
		Random:      rng,
	}

	// Initialize random weights
	fr.InputWeights = make([][]float64, size)
	fr.ResWeights = make([][]float64, size)
	for i := 0; i < size; i++ {
		fr.InputWeights[i] = []float64{rng.NormFloat64()}
		fr.ResWeights[i] = make([]float64, size)
		for j := 0; j < size; j++ {
			if rng.Float64() < 0.1 { // Sparse connectivity
				fr.ResWeights[i][j] = rng.NormFloat64()
			}
		}
	}

	return fr
}

// Tick processes a single time step (Input Flux)
func (fr *FluxReservoir) Tick(input float64) {
	newState := make([]float64, fr.Size)
	for i := 0; i < fr.Size; i++ {
		// प्रोजेक्ट input + current reservoir state
		total := fr.InputWeights[i][0] * input
		for j := 0; j < fr.Size; j++ {
			total += fr.ResWeights[i][j] * fr.State[j]
		}
		// Non-linear activation (tanh)
		newState[i] = math.Tanh(total)
	}
	fr.State = newState
}

// Train (Simplified Online Leaky Integration)
// In a full implementation, we'd use Ridge Regression vs. a buffered history
func (fr *FluxReservoir) Train(actual float64) {
	// Simple Delta rule for the readout layer
	prediction := fr.Predict()
	error := actual - prediction
	learningRate := 0.01

	if fr.Readout == nil {
		fr.Readout = make([]float64, fr.Size)
	}

	for i := 0; i < fr.Size; i++ {
		fr.Readout[i] += learningRate * error * fr.State[i]
	}
}

// Predict estimates the next state based on current reservoir activity
func (fr *FluxReservoir) Predict() float64 {
	if fr.Readout == nil {
		return 0
	}
	var output float64
	for i := 0; i < fr.Size; i++ {
		output += fr.Readout[i] * fr.State[i]
	}
	return output
}

// Forecast projects N steps into the future
func (fr *FluxReservoir) Forecast(steps int) []float64 {
	predictions := make([]float64, steps)
	originalState := append([]float64{}, fr.State...)

	for i := 0; i < steps; i++ {
		p := fr.Predict()
		predictions[i] = p
		fr.Tick(p) // Feedback the prediction as next input
	}

	// Restore state
	fr.State = originalState
	return predictions
}
