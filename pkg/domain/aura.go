package domain

// AuraType represents the business niche of the network
type AuraType string

const (
	AuraChurch     AuraType = "church"
	AuraSchool     AuraType = "school"
	AuraHospital   AuraType = "hospital"
	AuraRestaurant AuraType = "restaurant"
	AuraHome       AuraType = "home"
	AuraSecurity   AuraType = "security"
	AuraDefault    AuraType = "default"
)

// AuraProfile defines the capabilities and UI for a niche
type AuraProfile struct {
	Type         AuraType          `json:"type"`
	DisplayName  string            `json:"display_name"`
	Features     []string          `json:"features"`
	PortalConfig map[string]string `json:"portal_config"`
	Widgets      []string          `json:"widgets"`
}

// GetProfile returns the configuration for a specific aura
func GetProfile(t AuraType) AuraProfile {
	switch t {
	case AuraChurch:
		return AuraProfile{
			Type:        AuraChurch,
			DisplayName: "Sovereign Tabernacle",
			Features:    []string{"mpesa_contributions", "attendance_tracking", "sermon_casting"},
			Widgets:     []string{"offering_box", "event_calendar", "member_checkin"},
			PortalConfig: map[string]string{
				"theme":       "void-indigo",
				"welcome_msg": "Welcome to our digital sanctuary 🕊️",
			},
		}
	case AuraSchool:
		return AuraProfile{
			Type:        AuraSchool,
			DisplayName: "E-Classroom Core",
			Features:    []string{"nfc_attendance", "bookshop_payments", "child_safety_dns"},
			Widgets:     []string{"student_tap", "canteen_pay", "learning_resources"},
			PortalConfig: map[string]string{
				"theme":       "earth-green",
				"welcome_msg": "Knowledge is Power 📚",
			},
		}
	case AuraRestaurant:
		return AuraProfile{
			Type:        AuraRestaurant,
			DisplayName: "Nexus Dining Hub",
			Features:    []string{"canteen_payments", "guest_analytics", "automated_ordering"},
			Widgets:     []string{"menu_carousel", "bill_pay", "loyalty_stats"},
			PortalConfig: map[string]string{
				"theme":       "cosmic-red",
				"welcome_msg": "Enjoy your digital-first dining experience 🥘",
			},
		}
	case AuraHome:
		return AuraProfile{
			Type:        AuraHome,
			DisplayName: "Safe-Haven Network",
			Features:    []string{"parental_controls", "sleep_mode", "speed_boost"},
			Widgets:     []string{"usage_meter", "time_limits", "guest_toggle"},
			PortalConfig: map[string]string{
				"theme":       "stardust-violet",
				"welcome_msg": "Connected Home 👽",
			},
		}
	case AuraSecurity:
		return AuraProfile{
			Type:        AuraSecurity,
			DisplayName: "Fortress Zero-Trust",
			Features:    []string{"strict_biometrics", "ids_engagement", "stealth_mode"},
			Widgets:     []string{"biometric_auth", "security_vitals"},
			PortalConfig: map[string]string{
				"theme":       "oled-black",
				"welcome_msg": "AUTHORIZED PERSONNEL ONLY ⚠️",
			},
		}
	default:
		return AuraProfile{
			Type:        AuraDefault,
			DisplayName: "Standard Alien Net",
			Features:    []string{"basic_internet", "mpesa_vouchers"},
			Widgets:     []string{"voucher_input", "speed_test"},
		}
	}
}
