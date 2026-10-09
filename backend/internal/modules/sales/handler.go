package sales

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

func (r *Repository) FindAll(page, perPage int, cashierID uint, status string) ([]Sale, int64, error) {
	var sales []Sale
	var total int64
	q := r.db.Preload("Items").Preload("Payment")
	if cashierID > 0 {
		q = q.Where("cashier_id = ?", cashierID)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	q.Model(&Sale{}).Count(&total)
	err := q.Order("created_at DESC").Offset((page - 1) * perPage).Limit(perPage).Find(&sales).Error
	return sales, total, err
}

func (r *Repository) FindByID(id uint) (*Sale, error) {
	var s Sale
	err := r.db.Preload("Items").Preload("Payment").First(&s, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &s, err
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

func (s *Service) GetAll(page, perPage int, cashierID uint, status string) ([]Sale, int64, error) {
	return s.repo.FindAll(page, perPage, cashierID, status)
}

func (s *Service) GetByID(id uint) (*Sale, error) { return s.repo.FindByID(id) }

// Checkout processes the POS transaction atomically.
func (s *Service) Checkout(req CheckoutRequest, cashierID uint) (*Sale, error) {
	var totalAmount float64
	type resolvedItem struct {
		product  *products.Product
		quantity float64
		subtotal float64
	}
	var resolvedItems []resolvedItem

	// 1. Resolve all products and calculate totals server-side
	for _, item := range req.Items {
		p, err := s.productRepo.FindByID(item.ProductID)
		if err != nil || p == nil {
			return nil, fmt.Errorf("produk ID %d tidak ditemukan", item.ProductID)
		}
		if p.Status == "INACTIVE" {
			return nil, fmt.Errorf("produk '%s' tidak aktif", p.Name)
		}
		if p.Stock < item.Quantity {
			return nil, fmt.Errorf("stok produk '%s' tidak mencukupi (stok: %.3f, diminta: %.3f)", p.Name, p.Stock, item.Quantity)
		}
		subtotal := p.SellPrice * item.Quantity
		totalAmount += subtotal
		resolvedItems = append(resolvedItems, resolvedItem{product: p, quantity: item.Quantity, subtotal: subtotal})
	}

	// 2. Apply discount
	finalAmount := totalAmount - req.DiscountAmount
	if finalAmount < 0 {
		finalAmount = 0
	}

	// 3. Validate payment
	if req.PaymentMethod == "CASH" && req.PaidAmount < finalAmount {
		return nil, fmt.Errorf("pembayaran kurang: final %.2f, dibayar %.2f", finalAmount, req.PaidAmount)
	}
	changeAmount := req.PaidAmount - finalAmount
	if changeAmount < 0 {
		changeAmount = 0
	}

	// 4. Atomic DB transaction
	var sale Sale
	err := s.db.Transaction(func(tx *gorm.DB) error {
		saleNumber := helper.GenerateSaleNumber()
		sale = Sale{
			SaleNumber:     saleNumber,
			CashierID:      cashierID,
			ShiftID:        req.ShiftID,
			Status:         "COMPLETED",
			TotalAmount:    totalAmount,
			DiscountAmount: req.DiscountAmount,
			FinalAmount:    finalAmount,
			PaidAmount:     req.PaidAmount,
			ChangeAmount:   changeAmount,
			Notes:          req.Notes,
		}
		if err := tx.Create(&sale).Error; err != nil {
			return err
		}

		// Create sale items, update stock, create stock movements
		for _, ri := range resolvedItems {
			item := SaleItem{
				SaleID:    sale.ID,
				ProductID: ri.product.ID,
				Name:      ri.product.Name,
				Barcode:   ri.product.Barcode,
				Quantity:  ri.quantity,
				UnitPrice: ri.product.SellPrice,
				Subtotal:  ri.subtotal,
			}
			if err := tx.Create(&item).Error; err != nil {
				return err
			}

			newStock := ri.product.Stock - ri.quantity
			if err := s.productRepo.UpdateStock(tx, ri.product.ID, -ri.quantity); err != nil {
				return err
			}

			movement := &inventory.StockMovement{
				ProductID:     ri.product.ID,
				Type:          "OUT",
				Quantity:      -ri.quantity,
				StockBefore:   ri.product.Stock,
				StockAfter:    newStock,
				ReferenceType: "SALE",
				ReferenceID:   sale.ID,
				Notes:         fmt.Sprintf("Penjualan %s", saleNumber),
				CreatedByID:   cashierID,
			}
			if err := s.invRepo.CreateMovement(tx, movement); err != nil {
				return err
			}
		}

		// Create payment record
		payment := Payment{
			SaleID:       sale.ID,
			Method:       req.PaymentMethod,
			Amount:       req.PaidAmount,
			ChangeAmount: changeAmount,
		}
		return tx.Create(&payment).Error
	})

	if err != nil {
		return nil, err
	}
	return s.repo.FindByID(sale.ID)
}

// Void cancels a completed sale (admin only, no stock rollback in MVP).
func (s *Service) Void(id, userID uint, req VoidRequest) error {
	sale, err := s.repo.FindByID(id)
	if err != nil || sale == nil {
		return fmt.Errorf("transaksi tidak ditemukan")
	}
	if sale.Status != "COMPLETED" {
		return fmt.Errorf("hanya transaksi COMPLETED yang bisa di-void")
	}
	now := time.Now()
	return s.db.Model(sale).Updates(map[string]any{
		"status":       "VOID",
		"void_reason":  req.Reason,
		"voided_at":    now,
		"voided_by_id": userID,
	}).Error
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

	sales := rg.Group("/sales", middleware.AuthRequired())
	{
		sales.GET("", h.List)
		sales.POST("", h.Checkout) // kasir can checkout
		sales.GET("/:id", h.Get)
		sales.POST("/:id/void", middleware.AdminOnly(), h.Void)
	}
}

func (h *Handler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	role := c.GetString("role")
	userID := c.GetUint("user_id")

	var cashierID uint
	if role == "kasir" {
		cashierID = userID // kasir only sees their own sales
	} else {
		cid, _ := strconv.ParseUint(c.Query("cashier_id"), 10, 32)
		cashierID = uint(cid)
	}

	data, total, err := h.svc.GetAll(page, perPage, cashierID, c.Query("status"))
	if err != nil {
		response.InternalError(c)
		return
	}
	response.SuccessWithMeta(c, data, response.Meta{Page: page, PerPage: perPage, Total: total, TotalPage: helper.TotalPage(total, perPage)})
}

func (h *Handler) Get(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	sale, err := h.svc.GetByID(uint(id))
	if err != nil || sale == nil {
		response.NotFound(c, "Transaksi tidak ditemukan")
		return
	}

	// Kasir can only view their own sales
	if c.GetString("role") == "kasir" && sale.CashierID != c.GetUint("user_id") {
		response.Forbidden(c)
		return
	}
	response.Success(c, sale)
}

func (h *Handler) Checkout(c *gin.Context) {
	var req CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	cashierID := c.GetUint("user_id")
	sale, err := h.svc.Checkout(req, cashierID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Created(c, sale)
}

func (h *Handler) Void(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var req VoidRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	userID := c.GetUint("user_id")
	if err := h.svc.Void(uint(id), userID, req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Success(c, gin.H{"message": "Transaksi berhasil di-void"})
}
