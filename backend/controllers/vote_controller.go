package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"live-polling-app/backend/services"
	"live-polling-app/backend/utils"
)

type CastVoteInput struct {
	OptionID         string `json:"optionId" binding:"required"`
	VoterFingerprint string `json:"voterFingerprint" binding:"required"`
}

func CastVote(c *gin.Context) {
	pollID := c.Param("id")

	var input CastVoteInput

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	vote, err := services.CastVote(
		pollID,
		input.OptionID,
		input.VoterFingerprint,
	)

	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	c.JSON(http.StatusCreated, vote)
}

func GetPollResults(c *gin.Context) {
	pollID := c.Param("id")

	counts, err := services.GetVoteCountsByPoll(pollID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pollId": pollID,
		"counts": counts,
	})
}
