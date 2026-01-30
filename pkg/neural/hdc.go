package neural

import (
	"math/bits"
	"math/rand"
	"time"
)

// HyperVector represents a 10,240-bit holographic embedding (160 uint64s)
// Using 10k+ bits ensures near-orthogonal random distributions
type HyperVector [160]uint64

// HDCEngine handles holographic bit-processing
type HDCEngine struct {
	Dimension int
	Random    *rand.Rand
}

func NewHDCEngine() *HDCEngine {
	return &HDCEngine{
		Dimension: 10240,
		Random:    rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// GenerateRandomVector creates a new bipolar random vector
func (e *HDCEngine) GenerateRandomVector() HyperVector {
	var hv HyperVector
	for i := 0; i < 160; i++ {
		hv[i] = e.Random.Uint64()
	}
	return hv
}

// XOR calculates the distance between two vectors (Bitwise XOR)
func (e *HDCEngine) XOR(a, b HyperVector) HyperVector {
	var result HyperVector
	for i := 0; i < 160; i++ {
		result[i] = a[i] ^ b[i]
	}
	return result
}

// HammingDistance returns the similarity score (0.0 to 1.0)
// Higher score means more similar. 0.5 is random noise.
func (e *HDCEngine) HammingDistance(a, b HyperVector) float64 {
	totalBits := float64(e.Dimension)
	diffBits := 0
	for i := 0; i < 160; i++ {
		diffBits += bits.OnesCount64(a[i] ^ b[i])
	}
	// Normalize: 1.0 means identical, 0.0 means opposite
	return 1.0 - (float64(diffBits) / totalBits)
}

// Bind combines two vectors (XOR) - semantic composition
func (e *HDCEngine) Bind(a, b HyperVector) HyperVector {
	return e.XOR(a, b)
}

// Bundle aggregates multiple vectors using bitwise majority
func (e *HDCEngine) Bundle(vectors []HyperVector) HyperVector {
	if len(vectors) == 0 {
		return HyperVector{}
	}
	if len(vectors) == 1 {
		return vectors[0]
	}

	var result HyperVector
	threshold := len(vectors) / 2

	for i := 0; i < 160; i++ { // For each 64-bit block
		var block uint64
		for b := 0; b < 64; b++ { // For each bit in block
			count := 0
			for _, v := range vectors {
				if (v[i]>>b)&1 == 1 {
					count++
				}
			}
			if count > threshold {
				block |= (1 << b)
			}
		}
		result[i] = block
	}
	return result
}

// Permute shifts bits to represent sequence/order
func (e *HDCEngine) Permute(a HyperVector, shifts int) HyperVector {
	var result HyperVector
	// Simplified circular shift for performance
	for i := 0; i < 160; i++ {
		idx := (i + shifts) % 160
		if idx < 0 {
			idx += 160
		}
		result[idx] = a[i]
	}
	return result
}
