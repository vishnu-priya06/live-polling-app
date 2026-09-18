package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PollOption struct {
	ID   string `bson:"id" json:"id"`
	Text string `bson:"text" json:"text"`
}

type Poll struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Question  string             `bson:"question" json:"question"`
	Options   []PollOption       `bson:"options" json:"options"`
	CreatedBy primitive.ObjectID `bson:"createdBy" json:"createdBy"`
	IsActive  bool               `bson:"isActive" json:"isActive"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}
