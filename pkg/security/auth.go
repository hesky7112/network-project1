package security

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/bcrypt"
)

// SecureAuth provides secure authentication
type SecureAuth struct {
	pepper string
}

// NewSecureAuth creates a new secure auth instance
func NewSecureAuth() *SecureAuth {
	return &SecureAuth{
		pepper: generateRandomPepper(),
	}
}

// HashPassword creates a secure password hash using bcrypt + pepper
func (sa *SecureAuth) HashPassword(password string) (string, error) {
	// Add pepper to password
	pepperedPassword := password + sa.pepper

	// Generate bcrypt hash
	hash, err := bcrypt.GenerateFromPassword([]byte(pepperedPassword), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(hash), nil
}

// VerifyPassword verifies a password against hash
func (sa *SecureAuth) VerifyPassword(password, hash string) bool {
	// Add pepper to password
	pepperedPassword := password + sa.pepper

	// Compare hash
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(pepperedPassword))
	return err == nil
}

// GenerateSecureToken generates a cryptographically secure token
func (sa *SecureAuth) GenerateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// GenerateSessionToken generates a secure session token
func (sa *SecureAuth) GenerateSessionToken() (string, error) {
	return sa.GenerateSecureToken(32) // 64 hex characters
}

// ValidateToken validates token format and strength
func (sa *SecureAuth) ValidateToken(token string) error {
	if len(token) < 32 {
		return errors.New("token too short")
	}

	// Check if token contains only hex characters
	for _, char := range token {
		if !((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F')) {
			return errors.New("invalid token format")
		}
	}

	return nil
}

// GenerateCSRFToken generates a secure CSRF token
func (sa *SecureAuth) GenerateCSRFToken(sessionID string) string {
	// Use session ID + timestamp + random bytes
	timestamp := time.Now().Unix()
	randomBytes := make([]byte, 16)
	rand.Read(randomBytes)

	// Combine and hash
	combined := fmt.Sprintf("%s:%d:%x", sessionID, timestamp, randomBytes)
	hash := argon2.IDKey([]byte(combined), []byte(sa.pepper), 1, 64*1024, 4, 32)

	return hex.EncodeToString(hash)
}

// ValidateCSRFToken validates CSRF token
func (sa *SecureAuth) ValidateCSRFToken(token, sessionID string) bool {
	if len(token) != 64 { // 32 bytes = 64 hex chars
		return false
	}

	// Check recent timestamps (within 1 hour)
	currentTime := time.Now().Unix()
	for i := 0; i < 3600; i++ { // Check last hour
		timestamp := currentTime - int64(i)
		randomBytes := make([]byte, 16)
		rand.Read(randomBytes)

		combined := fmt.Sprintf("%s:%d:%x", sessionID, timestamp, randomBytes)
		hash := argon2.IDKey([]byte(combined), []byte(sa.pepper), 1, 64*1024, 4, 32)

		if hex.EncodeToString(hash) == token {
			return true
		}
	}

	return false
}

// Password strength validator
func (sa *SecureAuth) ValidatePasswordStrength(password string) error {
	if len(password) < 12 {
		return errors.New("password must be at least 12 characters long")
	}

	if len(password) > 128 {
		return errors.New("password must be less than 128 characters long")
	}

	// Check for required character types
	hasLower := false
	hasUpper := false
	hasNumber := false
	hasSpecial := false

	for _, char := range password {
		switch {
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= '0' && char <= '9':
			hasNumber = true
		case (char >= '!' && char <= '/') || (char >= ':' && char <= '@') || (char >= '[' && char <= '`') || (char >= '{' && char <= '~'):
			hasSpecial = true
		}
	}

	if !hasLower {
		return errors.New("password must contain at least one lowercase letter")
	}
	if !hasUpper {
		return errors.New("password must contain at least one uppercase letter")
	}
	if !hasNumber {
		return errors.New("password must contain at least one number")
	}
	if !hasSpecial {
		return errors.New("password must contain at least one special character")
	}

	return nil
}

// API key validation
func (sa *SecureAuth) ValidateAPIKey(apiKey string) error {
	if len(apiKey) != 36 {
		return errors.New("API key must be 36 characters long")
	}

	// Check UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
	parts := []int{8, 4, 4, 4, 12}
	pos := 0

	for _, partLen := range parts {
		if pos > 0 && apiKey[pos-1] != '-' {
			return errors.New("invalid API key format")
		}

		for i := 0; i < partLen; i++ {
			char := apiKey[pos+i]
			if !((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F')) {
				return errors.New("invalid API key format")
			}
		}
		pos += partLen + 1
	}

	return nil
}

// Rate limiting for authentication attempts
type AuthRateLimiter struct {
	attempts map[string][]time.Time
	maxAttempts int
	window time.Duration
}

// NewAuthRateLimiter creates a new auth rate limiter
func NewAuthRateLimiter() *AuthRateLimiter {
	return &AuthRateLimiter{
		attempts: make(map[string][]time.Time),
		maxAttempts: 5, // 5 attempts
		window: time.Minute * 15, // 15 minutes window
	}
}

// IsAllowed checks if authentication attempt is allowed
func (arl *AuthRateLimiter) IsAllowed(identifier string) bool {
	now := time.Now()

	// Clean old attempts
	var recentAttempts []time.Time
	for _, attempt := range arl.attempts[identifier] {
		if now.Sub(attempt) < arl.window {
			recentAttempts = append(recentAttempts, attempt)
		}
	}
	arl.attempts[identifier] = recentAttempts

	// Check if under limit
	if len(recentAttempts) >= arl.maxAttempts {
		return false
	}

	// Record this attempt
	arl.attempts[identifier] = append(arl.attempts[identifier], now)
	return true
}

// GetRemainingAttempts gets remaining attempts for identifier
func (arl *AuthRateLimiter) GetRemainingAttempts(identifier string) int {
	arl.IsAllowed(identifier) // Clean old attempts
	attempts := len(arl.attempts[identifier])
	if attempts >= arl.maxAttempts {
		return 0
	}
	return arl.maxAttempts - attempts
}

// GetResetTime gets time until attempts reset
func (arl *AuthRateLimiter) GetResetTime(identifier string) time.Time {
	if len(arl.attempts[identifier]) == 0 {
		return time.Now()
	}

	// Find oldest attempt
	oldest := arl.attempts[identifier][0]
	for _, attempt := range arl.attempts[identifier] {
		if attempt.Before(oldest) {
			oldest = attempt
		}
	}

	return oldest.Add(arl.window)
}

// Session management
type SessionManager struct {
	sessions map[string]SessionData
	maxAge   time.Duration
}

// SessionData holds session information
type SessionData struct {
	UserID    uint
	Username  string
	Role      string
	CreatedAt time.Time
	LastAccess time.Time
	IPAddress string
	UserAgent string
}

// NewSessionManager creates a new session manager
func NewSessionManager() *SessionManager {
	sm := &SessionManager{
		sessions: make(map[string]SessionData),
		maxAge:   time.Hour * 24, // 24 hours
	}

	// Clean up expired sessions periodically
	go sm.cleanupRoutine()

	return sm
}

// CreateSession creates a new session
func (sm *SessionManager) CreateSession(userID uint, username, role, ipAddress, userAgent string) (string, error) {
	// Generate secure session ID
	sessionID, err := generateSecureToken(32)
	if err != nil {
		return "", err
	}

	sessionData := SessionData{
		UserID:     userID,
		Username:   username,
		Role:       role,
		CreatedAt:  time.Now(),
		LastAccess: time.Now(),
		IPAddress:  ipAddress,
		UserAgent:  userAgent,
	}

	sm.sessions[sessionID] = sessionData
	return sessionID, nil
}

// GetSession retrieves session data
func (sm *SessionManager) GetSession(sessionID string) (*SessionData, bool) {
	session, exists := sm.sessions[sessionID]
	if !exists {
		return nil, false
	}

	// Check if session is expired
	if time.Since(session.LastAccess) > sm.maxAge {
		delete(sm.sessions, sessionID)
		return nil, false
	}

	// Update last access
	session.LastAccess = time.Now()
	sm.sessions[sessionID] = session

	return &session, true
}

// InvalidateSession invalidates a session
func (sm *SessionManager) InvalidateSession(sessionID string) {
	delete(sm.sessions, sessionID)
}

// GetActiveSessions gets all active sessions for a user
func (sm *SessionManager) GetActiveSessions(userID uint) []SessionData {
	var sessions []SessionData
	for _, session := range sm.sessions {
		if session.UserID == userID && time.Since(session.LastAccess) < sm.maxAge {
			sessions = append(sessions, session)
		}
	}
	return sessions
}

// Cleanup removes expired sessions
func (sm *SessionManager) cleanupRoutine() {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		sm.cleanup()
	}
}

func (sm *SessionManager) cleanup() {
	now := time.Now()
	for sessionID, session := range sm.sessions {
		if now.Sub(session.LastAccess) > sm.maxAge {
			delete(sm.sessions, sessionID)
		}
	}
}

// Generate secure random pepper
func generateRandomPepper() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func generateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
