package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"live-polling-app/backend/config"
	"live-polling-app/backend/models"
)

func CreatePoll(question string, optionTexts []string, createdBy primitive.ObjectID) (*models.Poll, error) {
	if len(optionTexts) < 2 {
		return nil, errors.New("a poll needs at least 2 options")
	}

	question = strings.TrimSpace(question)
	if question == "" {
		return nil, errors.New("question is required")
	}

	options := make([]models.PollOption, len(optionTexts))
	letters := "abcdefghijklmnopqrstuvwxyz"
	seenOptions := make(map[string]struct{}, len(optionTexts))

	for i, text := range optionTexts {
		text = strings.TrimSpace(text)
		if text == "" {
			return nil, errors.New("option text is required")
		}

		normalizedText := strings.ToLower(text)
		if _, exists := seenOptions[normalizedText]; exists {
			return nil, errors.New("each answer option must be different")
		}
		seenOptions[normalizedText] = struct{}{}

		options[i] = models.PollOption{
			ID:   string(letters[i]),
			Text: text,
		}
	}

	poll := models.Poll{
		ID:        primitive.NewObjectID(),
		Question:  question,
		Options:   options,
		CreatedBy: createdBy,
		IsActive:  true,
		CreatedAt: time.Now(),
	}

	collection := config.DB.Collection("polls")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, poll)
	if err != nil {
		return nil, err
	}

	return &poll, nil
}

func GetPollByID(pollID string) (*models.Poll, error) {
	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return nil, errors.New("invalid poll id")
	}

	collection := config.DB.Collection("polls")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var poll models.Poll

	err = collection.FindOne(
		ctx,
		bson.M{"_id": objID},
	).Decode(&poll)

	if err == mongo.ErrNoDocuments {
		return nil, errors.New("poll not found")
	}

	if err != nil {
		return nil, err
	}

	return &poll, nil
}

func GetPollsByUser(userID primitive.ObjectID) ([]models.Poll, error) {
	collection := config.DB.Collection("polls")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(
		ctx,
		bson.M{"createdBy": userID},
	)

	if err != nil {
		return nil, err
	}

	defer cursor.Close(ctx)

	var polls []models.Poll

	if err := cursor.All(ctx, &polls); err != nil {
		return nil, err
	}

	if polls == nil {
		polls = []models.Poll{}
	}

	return polls, nil
}

func DeletePoll(pollID string, userID primitive.ObjectID) error {
	objPollID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return errors.New("poll not found")
	}

	collection := config.DB.Collection("polls")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var poll models.Poll
	if err := collection.FindOne(ctx, bson.M{"_id": objPollID}).Decode(&poll); err != nil {
		if err == mongo.ErrNoDocuments {
			return errors.New("poll not found")
		}
		return err
	}

	if poll.CreatedBy != userID {
		return errors.New("you are not allowed to delete this poll")
	}

	if _, err := collection.DeleteOne(ctx, bson.M{"_id": objPollID, "createdBy": userID}); err != nil {
		return err
	}

	_, err = config.DB.Collection("votes").DeleteMany(ctx, bson.M{"pollId": objPollID})
	return err
}

func ClosePoll(pollID string, userID primitive.ObjectID) (*models.Poll, error) {
	objPollID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return nil, errors.New("poll not found")
	}

	collection := config.DB.Collection("polls")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var poll models.Poll
	if err := collection.FindOne(ctx, bson.M{"_id": objPollID}).Decode(&poll); err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("poll not found")
		}

		return nil, err
	}

	if poll.CreatedBy != userID {
		return nil, errors.New("you are not allowed to close this poll")
	}

	if !poll.IsActive {
		return nil, errors.New("poll is already closed")
	}

	if _, err := collection.UpdateOne(
		ctx,
		bson.M{"_id": objPollID, "createdBy": userID, "isActive": true},
		bson.M{"$set": bson.M{"isActive": false}},
	); err != nil {
		return nil, err
	}

	poll.IsActive = false
	return &poll, nil
}
