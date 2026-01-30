package radius

import (
	"context"
	"fmt"
	"log"
	"net"
	"time"

	"networking-main/internal/models"
	"networking-main/pkg/fup"
	"networking-main/pkg/hotspot"
	"networking-main/pkg/ipam"

	"gorm.io/gorm"
	"layeh.com/radius"
	"layeh.com/radius/rfc2865"
	"layeh.com/radius/rfc2866"
)

type Server struct {
	db     *gorm.DB
	secret string
	addr   string
	fup    *fup.Service
	ipam   *ipam.Service
	coa    *hotspot.CoAService
}

// NewServer creates a new RADIUS server
func NewServer(db *gorm.DB, secret, addr string, fup *fup.Service, ipam *ipam.Service) *Server {
	return &Server{
		db:     db,
		secret: secret,
		addr:   addr,
		fup:    fup,
		ipam:   ipam,
		coa:    hotspot.NewCoAService(secret),
	}
}

func (s *Server) Start(ctx context.Context) error {
	packetServer := radius.PacketServer{
		Addr:         s.addr,
		SecretSource: radius.StaticSecretSource([]byte(s.secret)),
		Handler:      radius.HandlerFunc(s.handlePacket),
	}

	log.Printf("Starting RADIUS server on %s", s.addr)

	errChan := make(chan error, 1)
	go func() {
		errChan <- packetServer.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		return nil
	case err := <-errChan:
		return err
	}
}

func (s *Server) handlePacket(w radius.ResponseWriter, r *radius.Request) {
	switch r.Code {
	case radius.CodeAccessRequest:
		s.handleAccessRequest(w, r)
	case radius.CodeAccountingRequest:
		s.handleAccountingRequest(w, r)
	default:
		log.Printf("Unknown RADIUS code: %v", r.Code)
	}
}

func (s *Server) handleAccessRequest(w radius.ResponseWriter, r *radius.Request) {
	username := rfc2865.UserName_GetString(r.Packet)
	password := rfc2865.UserPassword_GetString(r.Packet)

	log.Printf("RADIUS Access-Request for user: %s", username)

	var user models.HotspotUser
	err := s.db.Where("username = ? OR mac_address = ? OR phone_number = ?", username, username, username).First(&user).Error

	if err != nil {
		// User not found, check if it's a Voucher
		var voucher models.Voucher
		errV := s.db.Preload("PricingPackage").Where("code = ? AND status = ?", username, "active").First(&voucher).Error
		if errV == nil {
			// Found valid voucher!
			log.Printf("Valid inactive Voucher used as username: %s", username)
			// In a real flow, the voucher should be "redeemed" via API first.
			// But if the router just sends the code, we can accept it if active.
			s.acceptVoucher(w, r, voucher)
			return
		}

		log.Printf("User not found: %s", username)
		w.Write(r.Response(radius.CodeAccessReject))
		return
	}

	if user.IsBlacklisted {
		log.Printf("User blacklisted: %s", username)
		w.Write(r.Response(radius.CodeAccessReject))
		return
	}

	// Check password if it's PPPoE
	if user.ServiceType == "pppoe" {
		if user.Password != password {
			log.Printf("PPPoE Password mismatch for user: %s", username)
			w.Write(r.Response(radius.CodeAccessReject))
			return
		}
	}

	if time.Now().After(user.AccessExpiresAt) {
		log.Printf("User access expired: %s (Expired at %v)", username, user.AccessExpiresAt)
		w.Write(r.Response(radius.CodeAccessReject))
		return
	}

	// Successful authentication
	log.Printf("%s access accepted: %s", user.ServiceType, username)
	packet := r.Response(radius.CodeAccessAccept)

	// 4. IPAM - Assign/Check IP Lease
	lease, err := s.ipam.AllocateIP(context.Background(), 1, user.ID, user.MACAddress) // Defaulting to Pool ID 1 for now
	if err == nil {
		rfc2865.FramedIPAddress_Add(packet, net.ParseIP(lease.IPAddress))
	}

	// 5. FUP - Check for Throttling
	throttled, _ := s.fup.CheckFUPStatus(context.Background(), user.ID, 0) // Should use actual PackageID
	if throttled {
		down, up, _ := s.fup.GetThrottledSpeeds(context.Background(), 0)
		log.Printf("FUP Throttling active for user %s: %d/%d Kbps", username, down, up)
		// We could add MikroTik-specific attributes here for rate limiting
	}

	// Add session timeout attribute based on remaining time
	remaining := time.Until(user.AccessExpiresAt)
	rfc2865.SessionTimeout_Add(packet, rfc2865.SessionTimeout(remaining.Seconds()))

	w.Write(packet)
}

func (s *Server) acceptVoucher(w radius.ResponseWriter, r *radius.Request, v models.Voucher) {
	packet := r.Response(radius.CodeAccessAccept)
	duration := time.Duration(v.PricingPackage.Duration) * time.Minute
	rfc2865.SessionTimeout_Add(packet, rfc2865.SessionTimeout(duration.Seconds()))
	w.Write(packet)
}

func (s *Server) handleAccountingRequest(w radius.ResponseWriter, r *radius.Request) {
	username := rfc2865.UserName_GetString(r.Packet)
	statusType := rfc2866.AcctStatusType_Get(r.Packet)
	sessionID := rfc2866.AcctSessionID_GetString(r.Packet)
	nasIP := rfc2865.NASIPAddress_Get(r.Packet).String()
	framedIP := rfc2865.FramedIPAddress_Get(r.Packet).String()

	log.Printf("RADIUS Accounting-Request for user: %s, Status: %v, SessionID: %s", username, statusType, sessionID)

	switch statusType {
	case rfc2866.AcctStatusType_Value_Start:
		session := models.RadiusSession{
			UserName:  username,
			NasIP:     nasIP,
			FramedIP:  framedIP,
			SessionID: sessionID,
			StartTime: time.Now(),
		}
		s.db.Create(&session)

	case rfc2866.AcctStatusType_Value_Stop, rfc2866.AcctStatusType_Value_InterimUpdate:
		inputOctets := int64(rfc2866.AcctInputOctets_Get(r.Packet))
		outputOctets := int64(rfc2866.AcctOutputOctets_Get(r.Packet))

		var session models.RadiusSession
		err := s.db.Where("session_id = ?", sessionID).First(&session).Error
		if err == nil {
			session.InputOctets = inputOctets
			session.OutputOctets = outputOctets
			if statusType == rfc2866.AcctStatusType_Value_Stop {
				session.StopTime = time.Now()
				session.TerminationCause = fmt.Sprintf("%v", rfc2866.AcctTerminateCause_Get(r.Packet))
			}
			s.db.Save(&session)
			s.db.Save(&session)

			// Check FUP and Disconnect if needed
			// Note: We need UserID. RadiusSession has UserName.
			// We should probably look up the user again or store UserID in session.
			// For now, assuming username lookup is fast enough.
			var user models.HotspotUser
			if err := s.db.Where("username = ?", username).First(&user).Error; err == nil {
				throttled, _ := s.fup.CheckFUPStatus(context.Background(), user.ID, 0) // Should get PackageID from user
				if throttled {
					log.Printf("User %s exceeded FUP during session. Disconnecting...", username)
					go s.coa.DisconnectUser(context.Background(), nasIP, username, sessionID)
				}
			}
		}
	}

	w.Write(r.Response(radius.CodeAccountingResponse))
}
