package middleware

import (
	"os"

	"github.com/gin-gonic/gin"
)

// CORS adds the necessary CORS headers to allow the frontend to communicate
// with the backend during development and production.
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "" {
			origin = "*"
		}

		// In production, restrict to the configured frontend origin.
		allowedOrigin := os.Getenv("FRONTEND_ORIGIN")
		if allowedOrigin == "" {
			allowedOrigin = origin
		}

		c.Header("Access-Control-Allow-Origin", allowedOrigin)
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
