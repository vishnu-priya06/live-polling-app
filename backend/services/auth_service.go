package services

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"live-polling-app/backend/config"
	"live-polling-app/backend/models"
	"live-polling-app/backend/utils"
)

func SignupUser(name, email, password string) (*models.User, error) {
	collection := config.DB.Collection("users")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existing models.User

	err := collection.FindOne(
		ctx,
		bson.M{"email": email},
	).Decode(&existing)

	if err == nil {
		return nil, errors.New("email already registered")
	}

	if err != mongo.ErrNoDocuments {
		return nil, err
	}

	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return nil, err
	}

	user := models.User{
		ID:           primitive.NewObjectID(),
		Name:         name,
		Email:        email,
		PasswordHash: hashedPassword,
		CreatedAt:    time.Now(),
	}

	_, err = collection.InsertOne(ctx, user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func LoginUser(email, password string) (*models.User, error) {
	collection := config.DB.Collection("users")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User

	err := collection.FindOne(
		ctx,
		bson.M{"email": email},
	).Decode(&user)

	if err == mongo.ErrNoDocuments {
		return nil, errors.New("invalid email or password")
	}

	if err != nil {
		return nil, err
	}

	if !utils.CheckPasswordHash(password, user.PasswordHash) {
		return nil, errors.New("invalid email or password")
	}

	return &user, nil
}
