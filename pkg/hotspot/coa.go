package hotspot

import (
	"context"
	"fmt"

	"layeh.com/radius"
	"layeh.com/radius/rfc2865"
	"layeh.com/radius/rfc2866" // Start/Stop/Interim
	// CoA/Disconnect
)

// CoAService handles Change of Authorization (CoA) and Disconnect Messages
type CoAService struct {
	radiusSecret string
}

func NewCoAService(secret string) *CoAService {
	return &CoAService{
		radiusSecret: secret,
	}
}

// DisconnectUser sends a Disconnect-Request to the NAS to terminate a session
func (s *CoAService) DisconnectUser(ctx context.Context, nasIP string, username string, sessionID string) error {
	packet := radius.New(radius.CodeDisconnectRequest, []byte(s.radiusSecret))

	// Add attributes to identify the session
	if username != "" {
		rfc2865.UserName_SetString(packet, username)
	}
	if sessionID != "" {
		// Acct-Session-Id is usually in rfc2866
		rfc2866.AcctSessionID_SetString(packet, sessionID)
	}

	// Address of the NAS CoA port (typically 3799)
	nasAddr := fmt.Sprintf("%s:3799", nasIP)

	response, err := radius.Exchange(ctx, packet, nasAddr)
	if err != nil {
		return fmt.Errorf("failed to send disconnect request: %w", err)
	}

	if response.Code != radius.CodeDisconnectACK {
		return fmt.Errorf("received NAK from NAS: %v", response.Code)
	}

	return nil
}

// ChangeAuthorization sends a CoA-Request to update session attributes (e.g. rate limit)
func (s *CoAService) ChangeAuthorization(ctx context.Context, nasIP string, username string, sessionID string, downKbps, upKbps int) error {
	packet := radius.New(radius.CodeCoARequest, []byte(s.radiusSecret))

	if username != "" {
		rfc2865.UserName_SetString(packet, username)
	}
	if sessionID != "" {
		rfc2866.AcctSessionID_SetString(packet, sessionID)
	}

	// Address of the NAS CoA port (typically 3799)
	nasAddr := fmt.Sprintf("%s:3799", nasIP)

	response, err := radius.Exchange(ctx, packet, nasAddr)
	if err != nil {
		return fmt.Errorf("failed to send CoA request: %w", err)
	}

	if response.Code != radius.CodeCoAACK {
		return fmt.Errorf("received NAK from NAS: %v", response.Code)
	}

	return nil
}
