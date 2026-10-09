package inventory

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/arel10/pos-swalayan/internal/middleware"
	"github.com/arel10/pos-swalayan/internal/modules/products"
	"github.com/arel10/pos-swalayan/internal/shared/helper"
	"github.com/arel10/pos-swalayan/internal/shared/response"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Service handles business logic for inventory.
type Service struct {
	repo        *Repository
	productRepo *products.Repository
	db          *gorm.DB
}

func NewService(repo *Repository, productRepo *products.Repository, db *gorm.DB) *Service {
	return &Service{repo: repo, productRepo: productRepo, db: db}
}

func (s *Service) GetMovements(page, perPage int, productID uint) ([]StockMovement, int64, error) {
	return s.repo.FindMovements(page, perPage, productID)
}

// Adjust performs a manual stock adjustment atomically.
func (s *Service) Adjust(req AdjustmentRequest, userID uint) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		product, err := s.productRepo.FindByID(req.ProductID)
		if err != nil || product == nil {
			return fmt.Errorf("produk tidak ditemukan")
		}

		newStock := product.Stock + req.Quantity
		if newStock < 0 {
			return fmt.Errorf("stok tidak cukup, stok saat ini: %.3f", product.Stock)
		}

		// Update product stock
		if err := s.productRepo.UpdateStock(tx, req.ProductID, req.Quantity); err != nil {
			return err
		}

		movType := "IN"
		if req.Quantity < 0 {
			movType = "OUT"
		}

		// Create stock movement record
		movement := &StockMovement{
			ProductID:     req.ProductID,
			Type:          movType,
			Quantity:      req.Quantity,
			StockBefore:   product.Stock,
			StockAfter:    newStock,
			ReferenceType: "ADJUSTMENT",
			Notes:         req.Notes,
			CreatedByID:   userID,
		}
		return s.repo.CreateMovement(tx, movement)
	})
}

// ---- Handler ----

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	repo := NewRepository(db)
	prodRepo := products.NewRepository(db)
	svc := NewService(repo, prodRepo, db)
	h := NewHandler(svc)

	inv := rg.Group("/inventory", middleware.AuthRequired())
	{
		inv.GET("/movements", h.ListMovements)
		inv.POST("/adjustments", middleware.AdminOnly(), h.Adjust)
	}
}

func (h *Handler) ListMovements(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	productID, _ := strconv.ParseUint(c.Query("product_id"), 10, 32)

	data, total, err := h.svc.GetMovements(page, perPage, uint(productID))
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

func (h *Handler) Adjust(c *gin.Context) {
	var req AdjustmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	userID := c.GetUint("user_id")
	if err := h.svc.Adjust(req, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	response.Success(c, gin.H{"message": "Adjustment stok berhasil"})
}
