package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"live-polling-app/backend/services"
	"live-polling-app/backend/utils"
	"live-polling-app/backend/websocket"
)

type CreatePollInput struct {
	Question string   `json:"question" binding:"required,min=3"`
	Options  []string `json:"options" binding:"required,min=2,dive,required,min=1"`
}

func CreatePoll(c *gin.Context) {
	var input CreatePollInput

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	userIDStr := c.GetString("userID")

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid user")
		return
	}

	poll, err := services.CreatePoll(
		input.Question,
		input.Options,
		userID,
	)

	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	c.JSON(http.StatusCreated, poll)
}

func GetPoll(c *gin.Context) {
	pollID := c.Param("id")

	poll, err := services.GetPollByID(pollID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, err.Error())
		return
	}

	c.JSON(http.StatusOK, poll)
}

func GetMyPolls(c *gin.Context) {
	userIDStr := c.GetString("userID")

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid user")
		return
	}

	polls, err := services.GetPollsByUser(userID)
	if err != nil {
		utils.ErrorResponse(
			c,
			http.StatusInternalServerError,
			"Failed to fetch polls",
		)
		return
	}

	c.JSON(http.StatusOK, polls)
}

func DeletePoll(c *gin.Context) {
	userID, err := primitive.ObjectIDFromHex(c.GetString("userID"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid user")
		return
	}

	if err := services.DeletePoll(c.Param("id"), userID); err != nil {
		switch err.Error() {
		case "poll not found":
			utils.ErrorResponse(c, http.StatusNotFound, err.Error())
		case "you are not allowed to delete this poll":
			utils.ErrorResponse(c, http.StatusForbidden, err.Error())
		default:
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete poll")
		}
		return
	}

	c.Status(http.StatusNoContent)
}

func ClosePoll(c *gin.Context, hub *websocket.Hub) {
	userID, err := primitive.ObjectIDFromHex(c.GetString("userID"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid user")
		return
	}

	pollID := c.Param("id")
	poll, err := services.ClosePoll(pollID, userID)
	if err != nil {
		switch err.Error() {
		case "poll not found":
			utils.ErrorResponse(c, http.StatusNotFound, err.Error())
		case "you are not allowed to close this poll":
			utils.ErrorResponse(c, http.StatusForbidden, err.Error())
		case "poll is already closed":
			utils.ErrorResponse(c, http.StatusConflict, err.Error())
		default:
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to close poll")
		}
		return
	}

	lifecycleMessage, err := json.Marshal(gin.H{
		"type":   "poll_closed",
		"pollId": poll.ID.Hex(),
	})
	if err == nil {
		hub.Broadcast(poll.ID.Hex(), lifecycleMessage)
	}

	c.JSON(http.StatusOK, poll)
}
