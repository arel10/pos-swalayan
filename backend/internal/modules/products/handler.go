package products

import (
	"fmt"
	"strconv"

	"github.com/arel10/pos-swalayan/internal/middleware"
	"github.com/arel10/pos-swalayan/internal/shared/helper"
	"github.com/arel10/pos-swalayan/internal/shared/response"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Service handles business logic for products.
type Service struct {
	repo *Repository
	db   *gorm.DB
}

func NewService(repo *Repository, db *gorm.DB) *Service {
	return &Service{repo: repo, db: db}
}

func (s *Service) GetAll(page, perPage int, search, status string) ([]Product, int64, error) {
	return s.repo.FindAll(page, perPage, search, status)
}

func (s *Service) GetByID(id uint) (*Product, error) {
	return s.repo.FindByID(id)
}

func (s *Service) SearchForPOS(query string) ([]Product, error) {
	return s.repo.FindActiveBySKUOrBarcode(query)
}

func (s *Service) GetLowStock() ([]Product, error) {
	return s.repo.FindLowStock()
}

func (s *Service) Create(req CreateProductRequest) (*Product, error) {
	if s.repo.SKUExists(req.SKU, 0) {
		return nil, fmt.Errorf("SKU '%s' sudah digunakan", req.SKU)
	}
	if s.repo.BarcodeExists(req.Barcode, 0) {
		return nil, fmt.Errorf("barcode '%s' sudah digunakan", req.Barcode)
	}

	p := &Product{
		SKU:         req.SKU,
		Barcode:     req.Barcode,
		Name:        req.Name,
		CategoryID:  req.CategoryID,
		UnitID:      req.UnitID,
		BuyPrice:    req.BuyPrice,
		SellPrice:   req.SellPrice,
		MinStock:    req.MinStock,
		Description: req.Description,
		Status:      "ACTIVE",
	}
	return p, s.repo.Create(p)
}

func (s *Service) Update(id uint, req UpdateProductRequest) (*Product, error) {
	p, err := s.repo.FindByID(id)
	if err != nil || p == nil {
		return nil, fmt.Errorf("produk tidak ditemukan")
	}

	updates := map[string]any{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.CategoryID > 0 {
		updates["category_id"] = req.CategoryID
	}
	if req.UnitID > 0 {
		updates["unit_id"] = req.UnitID
	}
	if req.BuyPrice > 0 {
		updates["buy_price"] = req.BuyPrice
	}
	if req.SellPrice > 0 {
		updates["sell_price"] = req.SellPrice
	}
	if req.MinStock >= 0 {
		updates["min_stock"] = req.MinStock
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}

	if err := s.repo.Update(p, updates); err != nil {
		return nil, err
	}
	return s.repo.FindByID(id)
}

// ---- Handler ----

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo, db)
	h := NewHandler(svc)

	products := rg.Group("/products", middleware.AuthRequired())
	{
		products.GET("", h.List)
		products.POST("", middleware.AdminOnly(), h.Create)
		products.GET("/:id", h.Get)
		products.PATCH("/:id", middleware.AdminOnly(), h.Update)
	}

	// POS product search endpoint — accessible by all authenticated users
	rg.GET("/pos/products", middleware.AuthRequired(), h.POSSearch)
}

func (h *Handler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	search := c.Query("search")
	status := c.Query("status")

	data, total, err := h.svc.GetAll(page, perPage, search, status)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.SuccessWithMeta(c, data, response.Meta{
		Page:      page,
		PerPage:   perPage,
		Total:     total,
		TotalPage: helper.TotalPage(total, perPage),
	})
}

func (h *Handler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid")
		return
	}
	p, err := h.svc.GetByID(uint(id))
	if err != nil || p == nil {
		response.NotFound(c, "Produk tidak ditemukan")
		return
	}
	response.Success(c, p)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	p, err := h.svc.Create(req)
	if err != nil {
		response.Conflict(c, err.Error())
		return
	}
	response.Created(c, p)
}

func (h *Handler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "ID tidak valid")
		return
	}
	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	p, err := h.svc.Update(uint(id), req)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}
	response.Success(c, p)
}

func (h *Handler) POSSearch(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		response.BadRequest(c, "Parameter q wajib diisi")
		return
	}
	products, err := h.svc.SearchForPOS(query)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, products)
}
