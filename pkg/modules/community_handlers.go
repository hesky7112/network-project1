package modules

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// ========== Forums API ==========

// ListThreads returns threads with optional category filter
func (h *Handlers) ListThreads(c *gin.Context) {
	category := c.Query("category")
	sort := c.DefaultQuery("sort", "recent") // recent, hot, best, top
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 50 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	threads, total, err := h.registry.ListThreads(category, sort, pageSize, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch threads"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"threads": threads,
		"total":   total,
		"page":    page,
		"limit":   pageSize,
	})
}

// GetThread returns a single thread with posts
func (h *Handlers) GetThread(c *gin.Context) {
	id := c.Param("id")
	thread, err := h.registry.GetThread(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Thread not found"})
		return
	}
	c.JSON(http.StatusOK, thread)
}

// CreateThread creates a new discussion
func (h *Handlers) CreateThread(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req struct {
		Title    string         `json:"title" binding:"required"`
		Content  string         `json:"content" binding:"required"`
		Category ThreadCategory `json:"category" binding:"required"`
		Tags     []string       `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	thread := ForumThread{
		Title:    req.Title,
		Content:  req.Content,
		Category: req.Category,
		AuthorID: userID,
		Tags:     StringArray(req.Tags),
	}

	if err := h.registry.CreateThread(&thread); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to post thread"})
		return
	}

	c.JSON(http.StatusCreated, thread)
}

// ReplyToThread posts a reply
func (h *Handlers) ReplyToThread(c *gin.Context) {
	userID := c.GetUint("user_id")
	threadIDStr := c.Param("id")
	threadID, _ := strconv.Atoi(threadIDStr)

	var req struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Content required"})
		return
	}

	post := ForumPost{
		ThreadID:  uint(threadID),
		AuthorID:  userID,
		Content:   req.Content,
		CreatedAt: time.Now(),
	}

	if err := h.registry.CreatePost(&post); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reply"})
		return
	}

	c.JSON(http.StatusCreated, post)
}

func (h *Handlers) GetTrendingTags(c *gin.Context) {
	tags, err := h.registry.GetTrendingTags()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tags"})
		return
	}
	c.JSON(http.StatusOK, tags)
}

// ========== Leaderboard API ==========

func (h *Handlers) GetLeaderboard(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	users, err := h.registry.GetLeaderboard(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leaderboard"})
		return
	}

	c.JSON(http.StatusOK, users)
}

func (h *Handlers) GetUserStats(c *gin.Context) {
	// If id is "me", use auth context, else parse id
	paramID := c.Param("id")
	var userID uint
	if paramID == "me" {
		userID = c.GetUint("user_id")
	} else {
		uid, _ := strconv.Atoi(paramID)
		userID = uint(uid)
	}

	stats, err := h.registry.GetReputation(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stats"})
		return
	}
	c.JSON(http.StatusOK, stats)
}
