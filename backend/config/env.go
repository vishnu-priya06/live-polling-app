package config

import (
	"errors"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
)

func LoadEnv() {
	candidates := []string{
		".env",
		filepath.Join("backend", ".env"),
		filepath.Join("..", ".env"),
	}

	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			_ = godotenv.Load(candidate)
			return
		}
	}
}

func JWTSecret() (string, error) {
	secret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if secret == "" {
		return "", errors.New("JWT_SECRET is not configured")
	}

	if len(secret) < 32 {
		return "", errors.New("JWT_SECRET must be at least 32 characters long")
	}

	return secret, nil
}

func IsAllowedOrigin(origin string) bool {
	if origin == "" {
		return true
	}

	configuredOrigins := strings.TrimSpace(os.Getenv("ALLOWED_ORIGINS"))
	if configuredOrigins == "" {
		return origin == "http://localhost:5173" || origin == "http://localhost:5174" || origin == "http://localhost:5175" || origin == "http://127.0.0.1:5173" || origin == "http://127.0.0.1:5174" || origin == "http://127.0.0.1:5175"
	}

	for _, allowedOrigin := range strings.Split(configuredOrigins, ",") {
		if strings.TrimSpace(allowedOrigin) == origin {
			return true
		}
	}

	return false
}
