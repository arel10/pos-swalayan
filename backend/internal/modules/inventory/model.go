package inventory

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

// StockMovement records every change to a product's stock.
type StockMovement struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	ProductID     uint      `gorm:"not null;index" json:"product_id"`
	Type          string    `gorm:"type:enum('IN','OUT','ADJUSTMENT');not null" json:"type"`
	Quantity      float64   `gorm:"type:decimal(15,3);not null" json:"quantity"`
	StockBefore   float64   `gorm:"type:decimal(15,3)" json:"stock_before"`
	StockAfter    float64   `gorm:"type:decimal(15,3)" json:"stock_after"`
	ReferenceType string    `gorm:"size:50" json:"reference_type"` // e.g. SALE, PURCHASE, ADJUSTMENT
	ReferenceID   uint      `json:"reference_id"`
	Notes         string    `gorm:"type:text" json:"notes"`
	CreatedByID   uint      `json:"created_by_id"`
	CreatedAt     time.Time `json:"created_at"`
}

// AdjustmentRequest is the request body for a manual stock adjustment.
type AdjustmentRequest struct {
	ProductID uint    `json:"product_id" binding:"required"`
	Quantity  float64 `json:"quantity" binding:"required"` // positive = add, negative = subtract
	Notes     string  `json:"notes" binding:"required,min=5"`
}

// ---- Repository ----

type Repository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

func (r *Repository) FindMovements(page, perPage int, productID uint) ([]StockMovement, int64, error) {
	var movements []StockMovement
	var total int64
	q := r.db.Model(&StockMovement{})
	if productID > 0 {
		q = q.Where("product_id = ?", productID)
	}
	q.Count(&total)
	err := q.Order("created_at DESC").Offset((page - 1) * perPage).Limit(perPage).Find(&movements).Error
	return movements, total, err
}

func (r *Repository) FindByID(id uint) (*StockMovement, error) {
	var m StockMovement
	err := r.db.First(&m, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &m, err
}

func (r *Repository) CreateMovement(db *gorm.DB, m *StockMovement) error {
	return db.Create(m).Error
}
