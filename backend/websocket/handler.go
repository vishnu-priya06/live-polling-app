package websocket

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"live-polling-app/backend/config"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return config.IsAllowedOrigin(r.Header.Get("Origin"))
	},
}

func HandleWebSocket(hub *Hub, c *gin.Context) {
	pollID := c.Param("id")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	hub.AddClient(pollID, conn)

	defer func() {
		hub.RemoveClient(pollID, conn)
		conn.Close()
	}()

	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}
