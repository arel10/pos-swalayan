package categories

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

func (r *Repository) FindAll(page, perPage int, search string) ([]Category, int64, error) {
	var cats []Category
	var total int64
	q := r.db.Model(&Category{})
	if search != "" {
		q = q.Where("name LIKE ?", "%"+search+"%")
	}
	q.Count(&total)
	err := q.Offset((page - 1) * perPage).Limit(perPage).Find(&cats).Error
	return cats, total, err
}

func (r *Repository) FindByID(id uint) (*Category, error) {
	var cat Category
	err := r.db.First(&cat, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &cat, err
}

func (r *Repository) NameExists(name string, excludeID uint) bool {
	var count int64
	q := r.db.Model(&Category{}).Where("name = ?", name)
	if excludeID > 0 {
		q = q.Where("id != ?", excludeID)
	}
	q.Count(&count)
	return count > 0
}

func (r *Repository) Create(cat *Category) error { return r.db.Create(cat).Error }
func (r *Repository) Save(cat *Category) error   { return r.db.Save(cat).Error }

// ---- Service ----

type Service struct{ repo *Repository }

func NewService(repo *Repository) *Service { return &Service{repo: repo} }

func (s *Service) GetAll(page, perPage int, search string) ([]Category, int64, error) {
	return s.repo.FindAll(page, perPage, search)
}

func (s *Service) GetByID(id uint) (*Category, error) { return s.repo.FindByID(id) }

func (s *Service) Create(req CreateCategoryRequest) (*Category, error) {
	if s.repo.NameExists(req.Name, 0) {
		return nil, fmt.Errorf("kategori '%s' sudah ada", req.Name)
	}
	cat := &Category{Name: req.Name}
	return cat, s.repo.Create(cat)
}

func (s *Service) Update(id uint, req UpdateCategoryRequest) (*Category, error) {
	cat, err := s.repo.FindByID(id)
	if err != nil || cat == nil {
		return nil, fmt.Errorf("kategori tidak ditemukan")
	}
	if s.repo.NameExists(req.Name, id) {
		return nil, fmt.Errorf("kategori '%s' sudah ada", req.Name)
	}
	cat.Name = req.Name
	return cat, s.repo.Save(cat)
}

// ---- Handler ----

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	catGroup := rg.Group("/categories", middleware.AuthRequired())
	{
		catGroup.GET("", h.List)
		catGroup.POST("", middleware.AdminOnly(), h.Create)
		catGroup.GET("/:id", h.Get)
		catGroup.PATCH("/:id", middleware.AdminOnly(), h.Update)
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
	response.SuccessWithMeta(c, data, response.Meta{
		Page: page, PerPage: perPage, Total: total,
		TotalPage: helper.TotalPage(total, perPage),
	})
}

func (h *Handler) Get(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	cat, err := h.svc.GetByID(uint(id))
	if err != nil || cat == nil {
		response.NotFound(c, "Kategori tidak ditemukan")
		return
	}
	response.Success(c, cat)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	cat, err := h.svc.Create(req)
	if err != nil {
		response.Conflict(c, err.Error())
		return
	}
	response.Created(c, cat)
}

func (h *Handler) Update(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var req UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	cat, err := h.svc.Update(uint(id), req)
	if err != nil {
		response.Conflict(c, err.Error())
		return
	}
	response.Success(c, cat)
}
