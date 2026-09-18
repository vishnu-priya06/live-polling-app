package services

import (
	"context"
	"log"

	"live-polling-app/backend/config"
	"live-polling-app/backend/websocket"
)

func StartRedisSubscriber(hub *websocket.Hub) {
	go func() {

		pubsub := config.RedisClient.PSubscribe(
			context.Background(),
			"poll:*:updates",
		)

		defer pubsub.Close()

		log.Println("Redis Pub/Sub subscriber started")
		log.Println("Subscribed to pattern: poll:*:updates")

		for {
			message, err := pubsub.ReceiveMessage(context.Background())

			if err != nil {
				log.Println("Redis subscriber error:", err)
				continue
			}

			log.Println(
				"Redis message received:",
				message.Channel,
				message.Payload,
			)

			pollID := extractPollID(message.Channel)

			if pollID == "" {
				log.Println("Could not extract poll ID from channel:", message.Channel)
				continue
			}

			log.Println("Broadcasting update for poll:", pollID)

			hub.Broadcast(
				pollID,
				[]byte(message.Payload),
			)
		}
	}()
}

func extractPollID(channel string) string {
	const prefix = "poll:"
	const suffix = ":updates"

	if len(channel) <= len(prefix)+len(suffix) {
		return ""
	}

	if channel[:len(prefix)] != prefix {
		return ""
	}

	if channel[len(channel)-len(suffix):] != suffix {
		return ""
	}

	return channel[len(prefix) : len(channel)-len(suffix)]
}
