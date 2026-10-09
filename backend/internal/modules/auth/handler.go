package auth

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/arel10/pos-swalayan/internal/middleware"
	"github.com/arel10/pos-swalayan/internal/modules/users"
	"github.com/arel10/pos-swalayan/internal/shared/response"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// LoginRequest is the request body for login.
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Handler holds auth HTTP handlers.
type Handler struct {
	userRepo *users.Repository
}

// NewHandler creates a new auth handler.
func NewHandler(db *gorm.DB) *Handler {
	return &Handler{userRepo: users.NewRepository(db)}
}

// RegisterRoutes registers auth routes.
func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	h := NewHandler(db)
	auth := rg.Group("/auth")
	{
		auth.POST("/login", h.Login)
		auth.POST("/logout", middleware.AuthRequired(), h.Logout)
		auth.GET("/me", middleware.AuthRequired(), h.Me)
	}
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Username dan password wajib diisi")
		return
	}

	user, err := h.userRepo.FindByUsername(req.Username)
	if err != nil {
		response.InternalError(c)
		return
	}

	if user == nil || user.Status == "INACTIVE" {
		response.Unauthorized(c, "Username atau password salah")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		response.Unauthorized(c, "Username atau password salah")
		return
	}

	token, err := generateToken(user)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, gin.H{
		"access_token": token,
		"token_type":   "Bearer",
		"user": gin.H{
			"id":       user.ID,
			"name":     user.Name,
			"username": user.Username,
			"role":     user.Role.Name,
			"status":   user.Status,
		},
	})
}

func (h *Handler) Logout(c *gin.Context) {
	// Stateless JWT — client discards the token
	response.Success(c, gin.H{"message": "Logout berhasil"})
}

func (h *Handler) Me(c *gin.Context) {
	userID := c.GetUint("user_id")
	user, err := h.userRepo.FindByID(userID)
	if err != nil || user == nil {
		response.Unauthorized(c, "User tidak ditemukan")
		return
	}
	response.Success(c, gin.H{
		"id":       user.ID,
		"name":     user.Name,
		"username": user.Username,
		"role":     user.Role.Name,
		"status":   user.Status,
	})
}

// generateToken creates a signed JWT for the given user.
func generateToken(user *users.User) (string, error) {
	expiryHour, _ := strconv.Atoi(os.Getenv("JWT_ACCESS_EXPIRY_HOUR"))
	if expiryHour == 0 {
		expiryHour = 8
	}

	roleName := ""
	if user.Role != nil {
		roleName = user.Role.Name
	}

	claims := middleware.Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     roleName,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expiryHour) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   fmt.Sprintf("%d", user.ID),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}
