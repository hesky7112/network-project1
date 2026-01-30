package neural

import (
	"math"
	"strings"
)

// Vector represents a semantic embedding
type Vector []float32

// Document represents an entry in the vector store
type Document struct {
	ID       string                 `json:"id"`
	Content  string                 `json:"content"`
	Metadata map[string]interface{} `json:"metadata"`
	Vector   Vector                 `json:"-"`
}

// VectorEngine handles similarity calculations and storage
type VectorEngine struct {
	Documents []Document
}

// NewVectorEngine creates a fresh engine
func NewVectorEngine() *VectorEngine {
	return &VectorEngine{
		Documents: make([]Document, 0),
	}
}

// CosineSimilarity calculates how similar two vectors are (0 to 1)
func CosineSimilarity(v1, v2 Vector) float32 {
	if len(v1) != len(v2) || len(v1) == 0 {
		return 0
	}
	var dotProduct, mag1, mag2 float32
	for i := 0; i < len(v1); i++ {
		dotProduct += v1[i] * v2[i]
		mag1 += v1[i] * v1[i]
		mag2 += v2[i] * v2[i]
	}
	mag1 = float32(math.Sqrt(float64(mag1)))
	mag2 = float32(math.Sqrt(float64(mag2)))
	if mag1 == 0 || mag2 == 0 {
		return 0
	}
	return dotProduct / (mag1 * mag2)
}

// SemanticHasher simulates a transformer model (e.g. BERT)
// It converts text into a fixed-length vector based on word frequency and character patterns
func (e *VectorEngine) SemanticHasher(text string) Vector {
	text = strings.ToLower(text)
	words := strings.Fields(text)

	vectorSize := 128
	vector := make(Vector, vectorSize)

	// Fast Sim-Hash style encoding
	for _, word := range words {
		var hash uint64
		for _, char := range word {
			hash = uint64(char) + (hash << 6) + (hash << 16) - hash
		}

		// Fill bits based on hash
		for i := 0; i < vectorSize; i++ {
			if (hash>>(i%64))&1 == 1 {
				vector[i] += 1.0
			} else {
				vector[i] -= 1.0
			}
		}
	}

	// Normalize for cosine similarity
	return vector
}

// SearchResult represents a document with its similarity score
type SearchResult struct {
	Document
	Score float32 `json:"score"`
}

// Search finds the top N most similar documents
func (e *VectorEngine) Search(query string, topN int) []SearchResult {
	queryVector := e.SemanticHasher(query)

	results := make([]SearchResult, 0)

	for _, doc := range e.Documents {
		score := CosineSimilarity(queryVector, doc.Vector)
		results = append(results, SearchResult{doc, score})
	}

	// Simple sort (Bubble sort for this small demo, or standard sort)
	for i := 0; i < len(results)-1; i++ {
		for j := i + 1; j < len(results); j++ {
			if results[i].Score < results[j].Score {
				results[i], results[j] = results[j], results[i]
			}
		}
	}

	if len(results) > topN {
		results = results[:topN]
	}

	return results
}

// AddDocument inserts a new document and vectorizes it
func (e *VectorEngine) AddDocument(doc Document) {
	doc.Vector = e.SemanticHasher(doc.Content)
	e.Documents = append(e.Documents, doc)
}
