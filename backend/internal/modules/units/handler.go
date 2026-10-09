package units

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

func (r *Repository) FindAll(page, perPage int, search string) ([]Unit, int64, error) {
	var unitList []Unit
	var total int64
	q := r.db.Model(&Unit{})
	if search != "" {
		q = q.Where("name LIKE ?", "%"+search+"%")
	}
	q.Count(&total)
	err := q.Offset((page - 1) * perPage).Limit(perPage).Find(&unitList).Error
	return unitList, total, err
}

func (r *Repository) FindByID(id uint) (*Unit, error) {
	var u Unit
	err := r.db.First(&u, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &u, err
}

func (r *Repository) NameExists(name string, excludeID uint) bool {
	var count int64
	q := r.db.Model(&Unit{}).Where("name = ?", name)
	if excludeID > 0 {
		q = q.Where("id != ?", excludeID)
	}
	q.Count(&count)
	return count > 0
}

func (r *Repository) Create(u *Unit) error { return r.db.Create(u).Error }
func (r *Repository) Save(u *Unit) error   { return r.db.Save(u).Error }

// ---- Service ----

type Service struct{ repo *Repository }

func NewService(repo *Repository) *Service { return &Service{repo: repo} }

func (s *Service) GetAll(page, perPage int, search string) ([]Unit, int64, error) {
	return s.repo.FindAll(page, perPage, search)
}

func (s *Service) GetByID(id uint) (*Unit, error) { return s.repo.FindByID(id) }

func (s *Service) Create(req CreateUnitRequest) (*Unit, error) {
	if s.repo.NameExists(req.Name, 0) {
		return nil, fmt.Errorf("satuan '%s' sudah ada", req.Name)
	}
	u := &Unit{Name: req.Name, Abbreviation: req.Abbreviation}
	return u, s.repo.Create(u)
}

func (s *Service) Update(id uint, req UpdateUnitRequest) (*Unit, error) {
	u, err := s.repo.FindByID(id)
	if err != nil || u == nil {
		return nil, fmt.Errorf("satuan tidak ditemukan")
	}
	if req.Name != "" {
		if s.repo.NameExists(req.Name, id) {
			return nil, fmt.Errorf("satuan '%s' sudah ada", req.Name)
		}
		u.Name = req.Name
	}
	if req.Abbreviation != "" {
		u.Abbreviation = req.Abbreviation
	}
	return u, s.repo.Save(u)
}

// ---- Handler ----

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	unitGroup := rg.Group("/units", middleware.AuthRequired())
	{
		unitGroup.GET("", h.List)
		unitGroup.POST("", middleware.AdminOnly(), h.Create)
		unitGroup.GET("/:id", h.Get)
		unitGroup.PATCH("/:id", middleware.AdminOnly(), h.Update)
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
	u, err := h.svc.GetByID(uint(id))
	if err != nil || u == nil {
		response.NotFound(c, "Satuan tidak ditemukan")
		return
	}
	response.Success(c, u)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateUnitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	u, err := h.svc.Create(req)
	if err != nil {
		response.Conflict(c, err.Error())
		return
	}
	response.Created(c, u)
}

func (h *Handler) Update(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var req UpdateUnitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	u, err := h.svc.Update(uint(id), req)
	if err != nil {
		response.Conflict(c, err.Error())
		return
	}
	response.Success(c, u)
}
