package modules

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// ========== Forums ==========

type ThreadCategory string

const (
	CategoryGeneral    ThreadCategory = "general"
	CategorySolutions  ThreadCategory = "solutions"
	CategoryChallenges ThreadCategory = "challenges"
	CategoryShowcase   ThreadCategory = "showcase"
	CategorySupport    ThreadCategory = "support"
)

// ForumThread represents a discussion thread
type ForumThread struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	Title    string `json:"title" gorm:"size:255;not null"`
	Content  string `json:"content" gorm:"type:text;not null"`
	AuthorID uint   `json:"author_id" gorm:"index"`
	// Author    User           `json:"author" gorm:"foreignKey:AuthorID"` // Assuming User model exists
	Category  ThreadCategory `json:"category" gorm:"index"`
	Tags      StringArray    `json:"tags" gorm:"type:text"` // JSON array
	Upvotes   int            `json:"upvotes" gorm:"default:0"`
	Views     int            `json:"views" gorm:"default:0"`
	IsPinned  bool           `json:"is_pinned" gorm:"default:false"`
	IsLocked  bool           `json:"is_locked" gorm:"default:false"`
	SolvedBy  *uint          `json:"solved_by_post_id" gorm:"index"` // Link to the solution post
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`

	// Algo Scores
	HotScore    float64 `json:"hot_score" gorm:"index"`
	WilsonScore float64 `json:"wilson_score" gorm:"index"`

	Posts     []ForumPost `json:"posts,omitempty" gorm:"foreignKey:ThreadID"`
	PostCount int         `json:"post_count" gorm:"-"` // Computed
}

// ForumPost represents a reply in a thread
type ForumPost struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	ThreadID uint   `json:"thread_id" gorm:"index"`
	Content  string `json:"content" gorm:"type:text;not null"`
	AuthorID uint   `json:"author_id" gorm:"index"`
	// Author     User      `json:"author" gorm:"foreignKey:AuthorID"`
	Upvotes    int       `json:"upvotes" gorm:"default:0"`
	IsSolution bool      `json:"is_solution" gorm:"default:false"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// ========== Gamification ==========

// UserReputation tracks user stats and levels
type UserReputation struct {
	UserID         uint        `json:"user_id" gorm:"primaryKey"`
	Reputation     int         `json:"reputation" gorm:"default:0"`
	Level          int         `json:"level" gorm:"default:1"`
	ModulesCreated int         `json:"modules_created" gorm:"default:0"`
	SolutionsGiven int         `json:"solutions_given" gorm:"default:0"`
	Badges         StringArray `json:"badges" gorm:"type:text"` // JSON list of badge IDs
	LastActiveAt   time.Time   `json:"last_active_at"`
}

// Helper for JSON array storage in SQLite/Postgres
type StringArray []string

func (a *StringArray) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, a)
}

func (a StringArray) Value() (driver.Value, error) {
	return json.Marshal(a)
}
