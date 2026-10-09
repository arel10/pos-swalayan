package suppliers

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/arel10/pos-swalayan/internal/middleware"
	"github.com/arel10/pos-swalayan/internal/shared/helper"
	"github.com/arel10/pos-swalayan/internal/shared/response"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ---- Repository ----

type Repository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

func (r *Repository) FindAll(page, perPage int, search string) ([]Supplier, int64, error) {
	var sups []Supplier
	var total int64
	q := r.db.Model(&Supplier{})
	if search != "" {
		q = q.Where("name LIKE ? OR phone LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	q.Count(&total)
	err := q.Offset((page - 1) * perPage).Limit(perPage).Find(&sups).Error
	return sups, total, err
}

func (r *Repository) FindByID(id uint) (*Supplier, error) {
	var s Supplier
	err := r.db.First(&s, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &s, err
}

func (r *Repository) Create(s *Supplier) error { return r.db.Create(s).Error }
func (r *Repository) Save(s *Supplier) error   { return r.db.Save(s).Error }

// ---- Service ----

type Service struct{ repo *Repository }

func NewService(repo *Repository) *Service { return &Service{repo: repo} }

func (s *Service) GetAll(page, perPage int, search string) ([]Supplier, int64, error) {
	return s.repo.FindAll(page, perPage, search)
}

func (s *Service) GetByID(id uint) (*Supplier, error) { return s.repo.FindByID(id) }

func (s *Service) Create(req CreateSupplierRequest) (*Supplier, error) {
	sup := &Supplier{Name: req.Name, Phone: req.Phone, Email: req.Email, Address: req.Address}
	return sup, s.repo.Create(sup)
}

func (s *Service) Update(id uint, req UpdateSupplierRequest) (*Supplier, error) {
	sup, err := s.repo.FindByID(id)
	if err != nil || sup == nil {
		return nil, fmt.Errorf("supplier tidak ditemukan")
	}
	if req.Name != "" {
		sup.Name = req.Name
	}
	if req.Phone != "" {
		sup.Phone = req.Phone
	}
	if req.Email != "" {
		sup.Email = req.Email
	}
	if req.Address != "" {
		sup.Address = req.Address
	}
	if req.Status != "" {
		sup.Status = req.Status
	}
	return sup, s.repo.Save(sup)
}

// ---- Handler ----

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	supGroup := rg.Group("/suppliers", middleware.AuthRequired(), middleware.AdminOnly())
	{
		supGroup.GET("", h.List)
		supGroup.POST("", h.Create)
		supGroup.GET("/:id", h.Get)
		supGroup.PATCH("/:id", h.Update)
	}
}

func (h *Handler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	data, total, err := h.svc.GetAll(page, perPage, c.Query("search"))
	if err != nil {
		response.InternalError(c)
		return
	}
	response.SuccessWithMeta(c, data, response.Meta{Page: page, PerPage: perPage, Total: total, TotalPage: helper.TotalPage(total, perPage)})
}

func (h *Handler) Get(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	s, err := h.svc.GetByID(uint(id))
	if err != nil || s == nil {
		response.NotFound(c, "Supplier tidak ditemukan")
		return
	}
	response.Success(c, s)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	s, err := h.svc.Create(req)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Created(c, s)
}

func (h *Handler) Update(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var req UpdateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	s, err := h.svc.Update(uint(id), req)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}
	response.Success(c, s)
}
