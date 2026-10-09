package shifts

import (
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/arel10/pos-swalayan/internal/middleware"
	"github.com/arel10/pos-swalayan/internal/shared/helper"
	"github.com/arel10/pos-swalayan/internal/shared/response"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CashierShift represents a cashier's work shift.
type CashierShift struct {
	ID               uint       `gorm:"primaryKey" json:"id"`
	CashierID        uint       `gorm:"not null;index" json:"cashier_id"`
	Status           string     `gorm:"type:enum('OPEN','CLOSED');default:'OPEN'" json:"status"`
	OpeningCash      float64    `gorm:"type:decimal(15,2);default:0" json:"opening_cash"`
	ExpectedCash     float64    `gorm:"type:decimal(15,2);default:0" json:"expected_cash"`
	ActualCash       float64    `gorm:"type:decimal(15,2);default:0" json:"actual_cash"`
	CashVariance     float64    `gorm:"type:decimal(15,2);default:0" json:"cash_variance"`
	TotalSales       float64    `gorm:"type:decimal(15,2);default:0" json:"total_sales"`
	TransactionCount int        `gorm:"default:0" json:"transaction_count"`
	Notes            string     `gorm:"type:text" json:"notes"`
	OpenedAt         time.Time  `json:"opened_at"`
	ClosedAt         *time.Time `json:"closed_at"`
	CreatedAt        time.Time  `json:"created_at"`
}

type OpenShiftRequest struct {
	OpeningCash float64 `json:"opening_cash" binding:"min=0"`
	Notes       string  `json:"notes"`
}

type CloseShiftRequest struct {
	ActualCash float64 `json:"actual_cash" binding:"min=0"`
	Notes      string  `json:"notes"`
}

// ---- Repository ----

type Repository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

func (r *Repository) FindByID(id uint) (*CashierShift, error) {
	var s CashierShift
	err := r.db.First(&s, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &s, err
}

func (r *Repository) FindOpenByCashier(cashierID uint) (*CashierShift, error) {
	var s CashierShift
	err := r.db.Where("cashier_id = ? AND status = 'OPEN'", cashierID).First(&s).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &s, err
}

func (r *Repository) FindAll(page, perPage int, cashierID uint, status string) ([]CashierShift, int64, error) {
	var shifts []CashierShift
	var total int64
	q := r.db.Model(&CashierShift{})
	if cashierID > 0 {
		q = q.Where("cashier_id = ?", cashierID)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	q.Count(&total)
	err := q.Order("opened_at DESC").Offset((page - 1) * perPage).Limit(perPage).Find(&shifts).Error
	return shifts, total, err
}

func (r *Repository) Create(s *CashierShift) error { return r.db.Create(s).Error }
func (r *Repository) Save(s *CashierShift) error   { return r.db.Save(s).Error }

// ---- Service ----

type Service struct {
	repo *Repository
	db   *gorm.DB
}

func NewService(repo *Repository, db *gorm.DB) *Service { return &Service{repo: repo, db: db} }

func (s *Service) GetAll(page, perPage int, cashierID uint, status string) ([]CashierShift, int64, error) {
	return s.repo.FindAll(page, perPage, cashierID, status)
}

func (s *Service) GetByID(id uint) (*CashierShift, error) { return s.repo.FindByID(id) }

func (s *Service) OpenShift(req OpenShiftRequest, cashierID uint) (*CashierShift, error) {
	// Check if cashier already has an open shift
	existing, err := s.repo.FindOpenByCashier(cashierID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, fmt.Errorf("kasir masih memiliki shift yang sedang buka (ID: %d)", existing.ID)
	}

	shift := &CashierShift{
		CashierID:   cashierID,
		Status:      "OPEN",
		OpeningCash: req.OpeningCash,
		Notes:       req.Notes,
		OpenedAt:    time.Now(),
	}
	return shift, s.repo.Create(shift)
}

func (s *Service) CloseShift(id uint, req CloseShiftRequest, cashierID uint) (*CashierShift, error) {
	shift, err := s.repo.FindByID(id)
	if err != nil || shift == nil {
		return nil, fmt.Errorf("shift tidak ditemukan")
	}
	if shift.Status == "CLOSED" {
		return nil, fmt.Errorf("shift sudah ditutup")
	}

	// Calculate sales total for this shift
	var totalSales float64
	var count int64
	s.db.Table("sales").
		Where("shift_id = ? AND status = 'COMPLETED'", id).
		Select("COALESCE(SUM(final_amount), 0)").
		Scan(&totalSales)
	s.db.Table("sales").Where("shift_id = ? AND status = 'COMPLETED'", id).Count(&count)

	expectedCash := shift.OpeningCash + totalSales
	variance := req.ActualCash - expectedCash
	now := time.Now()

	shift.Status = "CLOSED"
	shift.ActualCash = req.ActualCash
	shift.ExpectedCash = expectedCash
	shift.CashVariance = variance
	shift.TotalSales = totalSales
	shift.TransactionCount = int(count)
	shift.ClosedAt = &now
	if req.Notes != "" {
		shift.Notes = req.Notes
	}

	return shift, s.repo.Save(shift)
}

// ---- Handler ----

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo, db)
	h := NewHandler(svc)

	shifts := rg.Group("/shifts", middleware.AuthRequired())
	{
		shifts.GET("", h.List)
		shifts.POST("/open", h.Open)
		shifts.GET("/:id", h.Get)
		shifts.POST("/:id/close", h.Close)
	}
}

func (h *Handler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	role := c.GetString("role")
	userID := c.GetUint("user_id")

	var cashierID uint
	if role == "kasir" {
		cashierID = userID
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
	shift, err := h.svc.GetByID(uint(id))
	if err != nil || shift == nil {
		response.NotFound(c, "Shift tidak ditemukan")
		return
	}
	response.Success(c, shift)
}

func (h *Handler) Open(c *gin.Context) {
	var req OpenShiftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	cashierID := c.GetUint("user_id")
	shift, err := h.svc.OpenShift(req, cashierID)
	if err != nil {
		response.Conflict(c, err.Error())
		return
	}
	response.Created(c, shift)
}

func (h *Handler) Close(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var req CloseShiftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	cashierID := c.GetUint("user_id")
	shift, err := h.svc.CloseShift(uint(id), req, cashierID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Success(c, shift)
}
