package models

import (
	"time"

	"gorm.io/gorm"
)

// Wallet represents a user's digital wallet
type Wallet struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"user_id" gorm:"uniqueIndex"`
	User      User           `json:"-" gorm:"foreignKey:UserID"`
	Balance   float64        `json:"balance" gorm:"default:0.0"`
	Currency  string         `json:"currency" gorm:"default:'KES'"`
	Status    string         `json:"status" gorm:"default:'active'"` // active, frozen
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// WalletTransaction represents a credit or debit to the wallet
type WalletTransaction struct {
	ID              uint           `json:"id" gorm:"primaryKey"`
	WalletID        uint           `json:"wallet_id" gorm:"index"`
	Wallet          Wallet         `json:"-" gorm:"foreignKey:WalletID"`
	Amount          float64        `json:"amount"`                 // Positive for credit, negative for debit
	Type            string         `json:"type"`                   // "topup", "purchase", "refund", "transfer"
	Reference       string         `json:"reference" gorm:"index"` // External ref (e.g. M-Pesa ID)
	Description     string         `json:"description"`
	Status          string         `json:"status" gorm:"default:'completed'"` // pending, completed, failed
	TransactionDate time.Time      `json:"transaction_date"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
