package main

import (
	"log"
	"net/url"

	"github.com/gorilla/websocket"
)

func main() {
	pollID := "6aaba9be415d31293c3d04af"

	u := url.URL{
		Scheme: "ws",
		Host:   "localhost:8080",
		Path:   "/ws/polls/" + pollID,
	}

	log.Println("Connecting to:", u.String())

	conn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		log.Fatal("WebSocket connection failed:", err)
	}

	defer conn.Close()

	log.Println("WebSocket connected successfully!")
	log.Println("Waiting for live poll updates...")

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Fatal("WebSocket read error:", err)
		}

		log.Println("LIVE UPDATE RECEIVED:", string(message))
	}
}
