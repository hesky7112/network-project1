package modules

import (
	"errors"
	"math"
	"sort"
	"strings"
	"time"

	"gorm.io/gorm"
)

// One-stop shop for community DB operations

// ========== Algorithms ==========

// CalculateHotScore implements Gravity Decay
// Score = (Votes - 1) / (Age + 2)^1.8
func CalculateHotScore(upvotes int, createdAt time.Time) float64 {
	ageHours := time.Since(createdAt).Hours()
	numerator := float64(upvotes) // Default score of 0 if no votes
	denominator := math.Pow(ageHours+2, 1.8)
	return numerator / denominator
}

// CalculateWilsonScore implements Wilson Score Interval for "Best" ranking
// Confidence level 95% (z=1.96)
func CalculateWilsonScore(upvotes int, totalVotes int) float64 {
	if totalVotes == 0 {
		return 0
	}
	n := float64(totalVotes)
	phat := float64(upvotes) / n
	z := 1.96

	// Wilson formulation
	numerator := phat + z*z/(2*n) - z*math.Sqrt((phat*(1-phat)+z*z/(4*n))/n)
	denominator := 1 + z*z/n
	return numerator / denominator
}

// ========== Forums ==========

func (r *Registry) CreateThread(thread *ForumThread) error {
	thread.CreatedAt = time.Now()
	thread.UpdatedAt = time.Now()
	// Init scores
	thread.HotScore = CalculateHotScore(0, thread.CreatedAt)
	thread.WilsonScore = 0 // No votes yet

	// Add reputation for creating a thread
	go r.AddReputation(thread.AuthorID, 5, "posted_thread")
	return r.DB.Create(thread).Error
}

func (r *Registry) ListThreads(category string, sortMethod string, limit, offset int) ([]ForumThread, int64, error) {
	var threads []ForumThread
	var total int64
	query := r.DB.Model(&ForumThread{})

	if category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Dynamic Sorting
	orderParams := "is_pinned DESC, updated_at DESC" // Default: Recent
	switch sortMethod {
	case "hot":
		orderParams = "is_pinned DESC, hot_score DESC"
	case "best":
		orderParams = "is_pinned DESC, wilson_score DESC"
	case "top":
		orderParams = "is_pinned DESC, upvotes DESC"
	case "recent":
		orderParams = "is_pinned DESC, created_at DESC"
	}

	err = query.Order(orderParams).
		Limit(limit).Offset(offset).
		Find(&threads).Error
	return threads, total, err
}

func (r *Registry) GetThread(id string) (*ForumThread, error) {
	var thread ForumThread
	err := r.DB.Preload("Posts").First(&thread, id).Error
	if err == nil {
		// Increment views async
		go r.IncrementViews(thread.ID)
	}
	return &thread, err
}

func (r *Registry) IncrementViews(threadID uint) {
	r.DB.Model(&ForumThread{}).Where("id = ?", threadID).
		UpdateColumn("views", gorm.Expr("views + ?", 1))
}

func (r *Registry) CreatePost(post *ForumPost) error {
	post.CreatedAt = time.Now()
	post.UpdatedAt = time.Now()

	err := r.DB.Create(post).Error
	if err != nil {
		return err
	}

	// Bump thread UpdatedAt & HotScore for activity
	var thread ForumThread
	if err := r.DB.First(&thread, post.ThreadID).Error; err == nil {
		// Activity Bump: Reset gravity slightly by "refreshing" time?
		// Or just re-calc based on new comment count (if we tracked it in score)
		// For simplicity, just update UpdatedAt which affects "New" sort,
		// HotScore is typically Vote/Time based.
		// Reddit bumps HotScore on comments too, but simpler here:
		r.updateThreadScores(&thread)
		r.DB.Save(&thread)
	}

	// Add reputation
	go r.AddReputation(post.AuthorID, 2, "replied")
	return nil
}

func (r *Registry) UpvoteThread(threadID uint, userID uint) error {
	// TODO: Track "UserUpvoted" table to prevent duplicates.
	// For MVP, just increment.

	var thread ForumThread
	if err := r.DB.First(&thread, threadID).Error; err != nil {
		return err
	}

	thread.Upvotes++
	r.updateThreadScores(&thread)

	if err := r.DB.Save(&thread).Error; err != nil {
		return err
	}

	// Award author
	go r.AddReputation(thread.AuthorID, 1, "thread_upvoted")
	return nil
}

func (r *Registry) updateThreadScores(thread *ForumThread) {
	thread.HotScore = CalculateHotScore(thread.Upvotes, thread.CreatedAt)
	// Assume 0 downvotes for now, so total = upvotes
	thread.WilsonScore = CalculateWilsonScore(thread.Upvotes, thread.Upvotes)
	thread.UpdatedAt = time.Now()
}

// ========== Trending Tags (Velocity) ==========

type TrendingTag struct {
	Tag      string  `json:"tag"`
	Velocity float64 `json:"velocity"` // Usage in last 24h
	Count    int     `json:"count"`
}

func (r *Registry) GetTrendingTags() ([]TrendingTag, error) {
	// Naive implementation: Get tags from threads created < 24h
	var recentThreads []ForumThread
	r.DB.Where("created_at > ?", time.Now().Add(-24*time.Hour)).Find(&recentThreads)

	tagCounts := make(map[string]int)
	for _, t := range recentThreads {
		var tags []string
		// Use a JSON parser or simple string split if stored as text
		// Since we use StringArray custom type which handles JSON:
		tags = t.Tags
		for _, tag := range tags {
			tagCounts[strings.TrimSpace(tag)]++
		}
	}

	var trending []TrendingTag
	for tag, count := range tagCounts {
		trending = append(trending, TrendingTag{Tag: tag, Velocity: float64(count), Count: count}) // Velocity = raw count for now
	}

	// Sort by count
	sort.Slice(trending, func(i, j int) bool {
		return trending[i].Count > trending[j].Count
	})

	if len(trending) > 10 {
		trending = trending[:10]
	}
	return trending, nil
}

// ========== Gamification (Reputation) ==========

func (r *Registry) GetReputation(userID uint) (*UserReputation, error) {
	var rep UserReputation
	err := r.DB.First(&rep, userID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Init if not found
		rep = UserReputation{UserID: userID, Reputation: 0, Level: 1}
		r.DB.Create(&rep)
		return &rep, nil
	}
	return &rep, err
}

func (r *Registry) AddReputation(userID uint, amount int, reason string) {
	rep, _ := r.GetReputation(userID)
	rep.Reputation += amount
	rep.LastActiveAt = time.Now()

	// Level up logic (simple: level = sqrt(rep/10) or every 100 points)
	newLevel := 1 + (rep.Reputation / 100)
	if newLevel > rep.Level {
		rep.Level = newLevel
		// Trigger "Level Up" event/notification here if we had notifications
	}

	r.DB.Save(rep)
}

func (r *Registry) GetLeaderboard(limit int) ([]UserReputation, error) {
	var leaderboard []UserReputation
	err := r.DB.Order("reputation DESC").Limit(limit).Find(&leaderboard).Error
	return leaderboard, err
}
