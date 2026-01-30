package auth

import (
	"testing"
)

func TestMaskPII(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Mask Email",
			input:    "User alice@example.com logged in",
			expected: "User a***@example.com logged in",
		},
		{
			name:     "Mask Phone",
			input:    "Call 123-456-7890 for support",
			expected: "Call ***-***-**** for support",
		},
		{
			name:     "Mask Both",
			input:    "Contact bob@test.com or 987.654.3210",
			expected: "Contact b***@test.com or ***-***-****",
		},
		{
			name:     "No PII",
			input:    "System started successfully",
			expected: "System started successfully",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := MaskPII(tt.input); got != tt.expected {
				t.Errorf("MaskPII() = %v, want %v", got, tt.expected)
			}
		})
	}
}
