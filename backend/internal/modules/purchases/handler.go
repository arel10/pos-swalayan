package purchases

import (
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/arel10/pos-swalayan/internal/middleware"
	"github.com/arel10/pos-swalayan/internal/modules/inventory"
	"github.com/arel10/pos-swalayan/internal/modules/products"
	"github.com/arel10/pos-swalayan/internal/shared/helper"
	"github.com/arel10/pos-swalayan/internal/shared/response"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ---- Repository ----

type Repository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

func (r *Repository) FindAll(page, perPage int, status string) ([]Purchase, int64, error) {
	var purchases []Purchase
	var total int64
	q := r.db.Preload("Items")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	q.Model(&Purchase{}).Count(&total)
	err := q.Order("created_at DESC").Offset((page - 1) * perPage).Limit(perPage).Find(&purchases).Error
	return purchases, total, err
}

func (r *Repository) FindByID(id uint) (*Purchase, error) {
	var p Purchase
	err := r.db.Preload("Items").First(&p, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &p, err
}

func (r *Repository) Create(p *Purchase, items []PurchaseItem) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(p).Error; err != nil {
			return err
		}
		for i := range items {
			items[i].PurchaseID = p.ID
		}
		return tx.Create(&items).Error
	})
}

func (r *Repository) UpdateStatus(p *Purchase, status string) error {
	return r.db.Model(p).Update("status", status).Error
}

func (r *Repository) UpdateReceivedAt(p *Purchase, t time.Time) error {
	return r.db.Model(p).Updates(map[string]any{"status": "RECEIVED", "received_at": t}).Error
}

// ---- Service ----

type Service struct {
	repo        *Repository
	productRepo *products.Repository
	invRepo     *inventory.Repository
	db          *gorm.DB
}

func NewService(repo *Repository, productRepo *products.Repository, invRepo *inventory.Repository, db *gorm.DB) *Service {
	return &Service{repo: repo, productRepo: productRepo, invRepo: invRepo, db: db}
}

func (s *Service) GetAll(page, perPage int, status string) ([]Purchase, int64, error) {
	return s.repo.FindAll(page, perPage, status)
}

func (s *Service) GetByID(id uint) (*Purchase, error) { return s.repo.FindByID(id) }

func (s *Service) Create(req CreatePurchaseRequest, userID uint) (*Purchase, error) {
	purchaseNumber := helper.GeneratePurchaseNumber()
	var totalAmount float64

	var items []PurchaseItem
	for _, item := range req.Items {
		subtotal := item.Quantity * item.BuyPrice
		totalAmount += subtotal
		items = append(items, PurchaseItem{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			BuyPrice:  item.BuyPrice,
			Subtotal:  subtotal,
		})
	}

	purchase := &Purchase{
		PurchaseNumber: purchaseNumber,
		SupplierID:     req.SupplierID,
		Status:         "DRAFT",
		TotalAmount:    totalAmount,
		Notes:          req.Notes,
		CreatedByID:    userID,
	}

	return purchase, s.repo.Create(purchase, items)
}

// Receive transitions purchase to RECEIVED and increments stock atomically.
func (s *Service) Receive(id, userID uint) error {
	purchase, err := s.repo.FindByID(id)
	if err != nil || purchase == nil {
		return fmt.Errorf("purchase tidak ditemukan")
	}
	if purchase.Status != "DRAFT" {
		return fmt.Errorf("hanya purchase berstatus DRAFT yang bisa di-receive")
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		now := time.Now()
		if err := s.repo.UpdateReceivedAt(purchase, now); err != nil {
			return err
		}

		for _, item := range purchase.Items {
			product, err := s.productRepo.FindByID(item.ProductID)
			if err != nil || product == nil {
				return fmt.Errorf("produk ID %d tidak ditemukan", item.ProductID)
			}

			if err := s.productRepo.UpdateStock(tx, item.ProductID, item.Quantity); err != nil {
				return err
			}

			movement := &inventory.StockMovement{
				ProductID:     item.ProductID,
				Type:          "IN",
				Quantity:      item.Quantity,
				StockBefore:   product.Stock,
				StockAfter:    product.Stock + item.Quantity,
				ReferenceType: "PURCHASE",
				ReferenceID:   purchase.ID,
				Notes:         fmt.Sprintf("Penerimaan PO %s", purchase.PurchaseNumber),
				CreatedByID:   userID,
			}
			if err := s.invRepo.CreateMovement(tx, movement); err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *Service) Cancel(id uint) error {
	purchase, err := s.repo.FindByID(id)
	if err != nil || purchase == nil {
		return fmt.Errorf("purchase tidak ditemukan")
	}
	if purchase.Status != "DRAFT" {
		return fmt.Errorf("hanya purchase berstatus DRAFT yang bisa dibatalkan")
	}
	return s.repo.UpdateStatus(purchase, "CANCELLED")
}

// ---- Handler ----

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	repo := NewRepository(db)
	prodRepo := products.NewRepository(db)
	invRepo := inventory.NewRepository(db)
	svc := NewService(repo, prodRepo, invRepo, db)
	h := NewHandler(svc)

	po := rg.Group("/purchases", middleware.AuthRequired(), middleware.AdminOnly())
	{
		po.GET("", h.List)
		po.POST("", h.Create)
		po.GET("/:id", h.Get)
		po.POST("/:id/receive", h.Receive)
		po.POST("/:id/cancel", h.Cancel)
	}
}

func (h *Handler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	data, total, err := h.svc.GetAll(page, perPage, c.Query("status"))
	if err != nil {
		response.InternalError(c)
		return
	}
	response.SuccessWithMeta(c, data, response.Meta{Page: page, PerPage: perPage, Total: total, TotalPage: helper.TotalPage(total, perPage)})
}

func (h *Handler) Get(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	p, err := h.svc.GetByID(uint(id))
	if err != nil || p == nil {
		response.NotFound(c, "Purchase tidak ditemukan")
		return
	}
	response.Success(c, p)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreatePurchaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	userID := c.GetUint("user_id")
	p, err := h.svc.Create(req, userID)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Created(c, p)
}

func (h *Handler) Receive(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	userID := c.GetUint("user_id")
	if err := h.svc.Receive(uint(id), userID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Purchase berhasil diterima, stok diperbarui"})
}

func (h *Handler) Cancel(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	if err := h.svc.Cancel(uint(id)); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Purchase dibatalkan"})
}
