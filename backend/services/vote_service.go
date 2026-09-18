package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"live-polling-app/backend/config"
	"live-polling-app/backend/models"
)

func CastVote(pollID, optionID, voterFingerprint string) (*models.Vote, error) {
	objPollID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return nil, errors.New("invalid poll id")
	}

	// 1. Poll must exist
	poll, err := GetPollByID(pollID)
	if err != nil {
		return nil, errors.New("poll not found")
	}

	// 2. Poll must be active
	if !poll.IsActive {
		return nil, errors.New("this poll is no longer accepting votes")
	}

	// 3. Option must belong to this poll
	validOption := false

	for _, opt := range poll.Options {
		if opt.ID == optionID {
			validOption = true
			break
		}
	}

	if !validOption {
		return nil, errors.New("invalid option for this poll")
	}

	collection := config.DB.Collection("votes")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 4. Prevent duplicate voting from the same fingerprint
	existingCount, err := collection.CountDocuments(ctx, bson.M{
		"pollId":           objPollID,
		"voterFingerprint": voterFingerprint,
	})

	if err != nil {
		return nil, err
	}

	if existingCount > 0 {
		return nil, errors.New("you have already voted on this poll")
	}

	// 5. Create vote
	vote := models.Vote{
		ID:               primitive.NewObjectID(),
		PollID:           objPollID,
		OptionID:         optionID,
		VoterFingerprint: voterFingerprint,
		CreatedAt:        time.Now(),
	}

	// 6. Save vote to MongoDB
	_, err = collection.InsertOne(ctx, vote)
	if err != nil {
		return nil, err
	}

	// 7. Update live vote counter in Redis
	redisKey := "poll:" + pollID + ":counts"

	if err := config.RedisClient.HIncrBy(
		config.RedisCtx,
		redisKey,
		optionID,
		1,
	).Err(); err != nil {
		return nil, err
	}

	// 8. Get updated counts from Redis
	redisCounts, err := config.RedisClient.HGetAll(
		config.RedisCtx,
		redisKey,
	).Result()

	if err != nil {
		return nil, err
	}

	// 9. Convert Redis string values to int64
	updatedCounts := make(map[string]int64)

	for option, count := range redisCounts {
		value, err := strconv.ParseInt(count, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid Redis count: %w", err)
		}

		updatedCounts[option] = value
	}

	// 10. Convert updated counts to JSON
	message, err := json.Marshal(updatedCounts)
	if err != nil {
		return nil, err
	}

	// 11. Publish updated counts through Redis Pub/Sub
	channel := "poll:" + pollID + ":updates"

	if err := config.RedisClient.Publish(
		config.RedisCtx,
		channel,
		message,
	).Err(); err != nil {
		return nil, err
	}

	return &vote, nil
}

func GetVoteCountsByPoll(pollID string) (map[string]int64, error) {
	objPollID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return nil, errors.New("invalid poll id")
	}

	collection := config.DB.Collection("votes")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Group votes by option and count them
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"pollId": objPollID,
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$optionId",
			"count": bson.M{"$sum": 1},
		}}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}

	defer cursor.Close(ctx)

	counts := make(map[string]int64)

	for cursor.Next(ctx) {
		var result struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		}

		if err := cursor.Decode(&result); err != nil {
			return nil, err
		}

		counts[result.ID] = result.Count
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return counts, nil
}
