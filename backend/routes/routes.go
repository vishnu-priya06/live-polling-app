package routes

import (
	"github.com/gin-gonic/gin"

	"live-polling-app/backend/controllers"
	"live-polling-app/backend/middleware"
	"live-polling-app/backend/websocket"
)

func RegisterRoutes(router *gin.Engine, hub *websocket.Hub) {

	// Authentication routes
	auth := router.Group("/api/auth")
	{
		auth.POST("/signup", controllers.Signup)
		auth.POST("/login", controllers.Login)
	}

	// Public routes
	// Anyone can view polls, vote, and view results.
	router.GET("/api/polls/:id", controllers.GetPoll)
	router.POST("/api/polls/:id/vote", controllers.CastVote)
	router.GET("/api/polls/:id/results", controllers.GetPollResults)

	// WebSocket route
	// Browsers connect here to receive live poll updates.
	router.GET("/ws/polls/:id", func(c *gin.Context) {
		websocket.HandleWebSocket(hub, c)
	})

	// Protected routes
	// Login required to create a poll or view your own polls.
	polls := router.Group("/api/polls")
	polls.Use(middleware.RequireAuth())
	{
		polls.POST("", controllers.CreatePoll)
		polls.GET("/mine", controllers.GetMyPolls)
		polls.DELETE("/:id", controllers.DeletePoll)
		polls.PATCH("/:id/close", func(c *gin.Context) {
			controllers.ClosePoll(c, hub)
		})
	}
}
