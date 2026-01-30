package modules

import (
	"time"
)

type DocCategory struct {
	ID        string    `json:"id" gorm:"primaryKey"` // e.g., "initialization"
	Title     string    `json:"title"`
	Order     int       `json:"order"`
	Pages     []DocPage `json:"pages" gorm:"foreignKey:CategoryID;references:ID"`
	CreatedAt time.Time `json:"created_at"`
}

type DocPage struct {
	ID         string    `json:"id" gorm:"primaryKey"` // e.g., "architecture", "ssh"
	CategoryID string    `json:"category_id" gorm:"index"`
	Title      string    `json:"title"`
	Content    string    `json:"content" gorm:"type:text"`
	Icon       string    `json:"icon"` // Name of lucide icon to map on frontend
	Order      int       `json:"order"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
