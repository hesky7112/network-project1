package webhooks

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"networking-main/internal/models"
	"time"

	"gorm.io/gorm"
)

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

// Dispatch sends a payload to all webhooks subscribed to an event
func (s *Service) Dispatch(ctx context.Context, event string, payload interface{}) {
	var webhooks []models.WebhookConfig
	s.db.WithContext(ctx).Where("is_active = ?", true).Find(&webhooks)

	for _, wh := range webhooks {
		if s.isSubscribed(wh.Events, event) {
			go s.fire(wh, event, payload)
		}
	}
}

func (s *Service) isSubscribed(eventsJson, event string) bool {
	var events []string
	if err := json.Unmarshal([]byte(eventsJson), &events); err != nil {
		return false
	}
	for _, e := range events {
		if e == event || e == "*" {
			return true
		}
	}
	return false
}

func (s *Service) fire(wh models.WebhookConfig, event string, payload interface{}) {
	data, err := json.Marshal(map[string]interface{}{
		"event":     event,
		"timestamp": time.Now().Unix(),
		"data":      payload,
	})
	if err != nil {
		log.Printf("Webhook error marshaling payload: %v", err)
		return
	}

	req, err := http.NewRequest("POST", wh.URL, bytes.NewBuffer(data))
	if err != nil {
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-SuperWiFi-Event", event)

	// Signature for security
	if wh.Secret != "" {
		sig := s.calculateSignature(data, wh.Secret)
		req.Header.Set("X-SuperWiFi-Signature", sig)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Webhook dispatch failed to %s: %v", wh.URL, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		log.Printf("Webhook returned error %d from %s", resp.StatusCode, wh.URL)
	}
}

func (s *Service) calculateSignature(payload []byte, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	return hex.EncodeToString(h.Sum(nil))
}
