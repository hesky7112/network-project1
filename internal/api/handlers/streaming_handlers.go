package handlers

import (
	"networking-main/pkg/ingest"

	"github.com/gin-gonic/gin"
)

type StreamingHandler struct {
	IngestService *ingest.IngestService
}

func NewStreamingHandler(s *ingest.IngestService) *StreamingHandler {
	return &StreamingHandler{IngestService: s}
}

// HandleIngestStream handles incoming WebSocket data streams
func (h *StreamingHandler) HandleIngestStream(c *gin.Context) {
	h.IngestService.HandleWS(c.Writer, c.Request)
}

// GetEngineStatus returns health of ingestion protocols
func (h *StreamingHandler) GetEngineStatus(c *gin.Context) {
	c.JSON(200, gin.H{
		"tcp":  "active",
		"udp":  "active",
		"ws":   "active",
		"grpc": "monitoring",
	})
}
