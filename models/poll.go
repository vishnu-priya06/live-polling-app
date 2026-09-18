package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Poll struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Question  string             `bson:"question" json:"question"`
	Options   []string           `bson:"options" json:"options"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}