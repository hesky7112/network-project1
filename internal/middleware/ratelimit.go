package middleware

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
)

type RateLimiter struct {
	redisClient *redis.Client
}

func NewRateLimiter(rdb *redis.Client) *RateLimiter {
	return &RateLimiter{redisClient: rdb}
}

// RateLimitMiddleware enforces rate limits per user/IP
func (rl *RateLimiter) RateLimit(limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Identify user: Priority to UserID (auth), fallback to IP
		key := c.ClientIP()
		if userID, exists := c.Get("userID"); exists {
			key = fmt.Sprintf("user:%v", userID)
		}

		redisKey := fmt.Sprintf("rate_limit:%s", key)

		// Increment counter
		count, err := rl.redisClient.Incr(context.Background(), redisKey).Result()
		if err != nil {
			// Fail open if Redis is down, but log it
			c.Next()
			return
		}

		// Set expiration on first request
		if count == 1 {
			rl.redisClient.Expire(context.Background(), redisKey, window)
		}

		// Check limit
		if count > int64(limit) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":       "Rate limit exceeded",
				"retry_after": window.Seconds(),
			})
			return
		}

		c.Next()
	}
}

// TieredRateLimit applies different limits based on user role
func (rl *RateLimiter) TieredRateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		limit := 60 // Default: 60 req/min

		switch role {
		case "admin":
			limit = 1000
		case "staff":
			limit = 300
		case "premium":
			limit = 120
		}

		// Use the standard logic with dynamic limit
		rl.RateLimit(limit, time.Minute)(c)
	}
}
