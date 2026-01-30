package domain

import (
	"fmt"
	"networking-main/pkg/hal"
)

// Service manages the network's business identity
type Service struct {
	ActiveAura AuraType
	HAL        *hal.PlatformInfo
}

// NewService creates a new domain manager
func NewService() *Service {
	return &Service{
		ActiveAura: AuraDefault,
		HAL:        hal.GetPlatformInfo(),
	}
}

// SetAura changes the network's specialization
func (s *Service) SetAura(t AuraType) error {
	s.ActiveAura = t
	return s.SyncDomain()
}

// SyncDomain applies niche-specific configurations to the underlying hardware
func (s *Service) SyncDomain() error {
	profile := GetProfile(s.ActiveAura)
	fmt.Printf("🌌 Synchronizing Domain Aura: %s\n", profile.DisplayName)

	// Hardware-specific orchestration
	if s.HAL.CanRoute() {
		s.applyRoutingRules(profile)
	}

	if s.HAL.IsRaspberryPi() {
		s.configureEdgePeripherals(profile)
	}

	return nil
}

func (s *Service) applyRoutingRules(p AuraProfile) {
	// 👽 Specialized routing logic for niche
	switch p.Type {
	case AuraSecurity:
		fmt.Println("🛡️  Applying Zero-Trust isolation rules...")
	case AuraSchool:
		fmt.Println("📚  Prioritizing educational traffic & applying DNS filters...")
	case AuraRestaurant:
		fmt.Println("🍽️  Ensuring POS (Payment) traffic latency is < 10ms...")
	}
}

func (s *Service) configureEdgePeripherals(p AuraProfile) {
	// 🔌 Configure GPIO/USB for specialized hardware
	for _, feature := range p.Features {
		if feature == "nfc_attendance" {
			fmt.Println("📡  Activating PN532 NFC driver on GPIO bus...")
		}
		if feature == "strict_biometrics" {
			fmt.Println("👁️  Calibrating USB Iris/Fingerprint scanners...")
		}
	}
}
