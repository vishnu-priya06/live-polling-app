package controllers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"live-polling-app/backend/services"
	"live-polling-app/backend/utils"
)

type SignupInput struct {
	Name     string `json:"name" binding:"required,min=2"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func Signup(c *gin.Context) {
	var input SignupInput

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	user, err := services.SignupUser(
		input.Name,
		input.Email,
		input.Password,
	)

	if err != nil {
		utils.ErrorResponse(c, http.StatusConflict, err.Error())
		return
	}

	token, err := utils.GenerateToken(user.ID.Hex())
	if err != nil {
		log.Printf("signup token generation failed: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user":  user,
	})
}

func Login(c *gin.Context) {
	var input LoginInput

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	user, err := services.LoginUser(
		input.Email,
		input.Password,
	)

	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}

	token, err := utils.GenerateToken(user.ID.Hex())
	if err != nil {
		log.Printf("login token generation failed: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}
