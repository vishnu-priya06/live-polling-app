package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"

	"live-polling-app/backend/config"
	"live-polling-app/backend/middleware"
	"live-polling-app/backend/routes"
	"live-polling-app/backend/services"
	"live-polling-app/backend/websocket"
)

func resolvePort() string {
	port := os.Getenv("PORT")
	if port == "" {
		return "8080"
	}

	return port
}

func main() {
	config.LoadEnv()

	// Connect to MongoDB
	config.ConnectDB()

	// Connect to Redis
	config.ConnectRedis()

	// Create Gin router
	router := gin.Default()
	router.Use(middleware.CORS())

	// Create WebSocket hub
	hub := websocket.NewHub()

	// Register all API and WebSocket routes
	routes.RegisterRoutes(router, hub)
	services.StartRedisSubscriber(hub)

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	port := resolvePort()
	log.Println("Server listening on port " + port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
