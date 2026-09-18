package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"

	"live-polling-app/backend/utils"
)

func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.ErrorResponse(c, 401, "Missing Authorization header")
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" || strings.TrimSpace(parts[1]) == "" {
			utils.ErrorResponse(c, 401, "Invalid Authorization header format")
			c.Abort()
			return
		}

		userID, err := utils.ValidateToken(parts[1])
		if err != nil {
			utils.ErrorResponse(c, 401, "Invalid or expired token")
			c.Abort()
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}

func AuthRequired() gin.HandlerFunc {
	return RequireAuth()
}
