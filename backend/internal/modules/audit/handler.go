package audit

import (
	"strconv"
	"time"

	"github.com/arel10/pos-swalayan/internal/middleware"
	"github.com/arel10/pos-swalayan/internal/shared/helper"
	"github.com/arel10/pos-swalayan/internal/shared/response"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AuditLog records important system activities.
type AuditLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"index" json:"user_id"`
	Username    string    `gorm:"size:50" json:"username"`
	Action      string    `gorm:"size:100;not null" json:"action"` // e.g. LOGIN, CREATE_PRODUCT, VOID_SALE
	Module      string    `gorm:"size:50" json:"module"`           // e.g. auth, products, sales
	ReferenceID uint      `json:"reference_id"`
	Description string    `gorm:"type:text" json:"description"`
	IPAddress   string    `gorm:"size:50" json:"ip_address"`
	CreatedAt   time.Time `json:"created_at"`
}

// ---- Repository ----

type Repository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

func (r *Repository) FindAll(page, perPage int, module, action string) ([]AuditLog, int64, error) {
	var logs []AuditLog
	var total int64
	q := r.db.Model(&AuditLog{})
	if module != "" {
		q = q.Where("module = ?", module)
	}
	if action != "" {
		q = q.Where("action LIKE ?", "%"+action+"%")
	}
	q.Count(&total)
	err := q.Order("created_at DESC").Offset((page - 1) * perPage).Limit(perPage).Find(&logs).Error
	return logs, total, err
}

// Log records an audit event. Call this from services or handlers.
func (r *Repository) Log(db *gorm.DB, entry AuditLog) {
	db.Create(&entry) // fire-and-forget; errors are non-critical
}

// ---- Handler ----

type Handler struct{ repo *Repository }

func NewHandler(repo *Repository) *Handler { return &Handler{repo: repo} }

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	repo := NewRepository(db)
	h := NewHandler(repo)
	rg.GET("/audit-logs", middleware.AuthRequired(), middleware.AdminOnly(), h.List)
}

func (h *Handler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	data, total, err := h.repo.FindAll(page, perPage, c.Query("module"), c.Query("action"))
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
