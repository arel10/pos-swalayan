package users

import (
	"net/http"
	"strconv"

	"github.com/arel10/pos-swalayan/internal/middleware"
	"github.com/arel10/pos-swalayan/internal/shared/helper"
	"github.com/arel10/pos-swalayan/internal/shared/response"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Handler holds user HTTP handlers.
type Handler struct {
	service *Service
}

// NewHandler creates a new user handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers user routes.
func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	users := rg.Group("/users", middleware.AuthRequired(), middleware.AdminOnly())
	{
		users.GET("", h.ListUsers)
		users.POST("", h.CreateUser)
		users.GET("/:id", h.GetUser)
		users.PATCH("/:id", h.UpdateUser)
		users.POST("/:id/reset-password", h.ResetPassword)
	}

	rg.GET("/roles", middleware.AuthRequired(), h.ListRoles)
}

func (h *Handler) ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	search := c.Query("search")

	users, total, err := h.service.GetAll(page, perPage, search)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.SuccessWithMeta(c, users, response.Meta{
		Page:      page,
		PerPage:   perPage,
		Total:     total,
		TotalPage: helper.TotalPage(total, perPage),
	})
}

func (h *Handler) GetUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid")
		return
	}

	user, err := h.service.GetByID(uint(id))
	if err != nil {
		response.InternalError(c)
		return
	}
	if user == nil {
		response.NotFound(c, "User tidak ditemukan")
		return
	}

	response.Success(c, user)
}

func (h *Handler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.service.Create(req)
	if err != nil {
		response.Conflict(c, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": user})
}

func (h *Handler) UpdateUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid")
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.service.Update(uint(id), req)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, user)
}

func (h *Handler) ResetPassword(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid")
		return
	}

	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if err := h.service.ResetPassword(uint(id), req); err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "Password berhasil direset"})
}

func (h *Handler) ListRoles(c *gin.Context) {
	roles, err := h.service.GetRoles()
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, roles)
}
