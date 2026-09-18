package websocket

import (
	"sync"

	"github.com/gorilla/websocket"
)

type Hub struct {
	clients map[string]map[*websocket.Conn]bool
	mu      sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[string]map[*websocket.Conn]bool),
	}
}

func (h *Hub) AddClient(pollID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.clients[pollID] == nil {
		h.clients[pollID] = make(map[*websocket.Conn]bool)
	}

	h.clients[pollID][conn] = true
}

func (h *Hub) RemoveClient(pollID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if pollClients, exists := h.clients[pollID]; exists {
		delete(pollClients, conn)

		if len(pollClients) == 0 {
			delete(h.clients, pollID)
		}
	}
}

func (h *Hub) Broadcast(pollID string, message []byte) {
	h.mu.RLock()

	connections := make([]*websocket.Conn, 0)

	for conn := range h.clients[pollID] {
		connections = append(connections, conn)
	}

	h.mu.RUnlock()

	for _, conn := range connections {
		if err := conn.WriteMessage(
			websocket.TextMessage,
			message,
		); err != nil {
			h.RemoveClient(pollID, conn)
			conn.Close()
		}
	}
}
