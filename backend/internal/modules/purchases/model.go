package purchases

import (
	"time"
)

// Purchase represents a purchase order header.
type Purchase struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	PurchaseNumber string         `gorm:"uniqueIndex;size:50;not null" json:"purchase_number"`
	SupplierID     uint           `gorm:"not null" json:"supplier_id"`
	Status         string         `gorm:"size:20;default:'DRAFT'" json:"status"`
	TotalAmount    float64        `gorm:"type:decimal(15,2);default:0" json:"total_amount"`
	Notes          string         `gorm:"type:text" json:"notes"`
	ReceivedAt     *time.Time     `json:"received_at"`
	CreatedByID    uint           `json:"created_by_id"`
	Items          []PurchaseItem `gorm:"foreignKey:PurchaseID" json:"items,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}

// PurchaseItem represents a line item in a purchase order.
type PurchaseItem struct {
	ID         uint    `gorm:"primaryKey" json:"id"`
	PurchaseID uint    `gorm:"not null;index" json:"purchase_id"`
	ProductID  uint    `gorm:"not null" json:"product_id"`
	Quantity   float64 `gorm:"type:decimal(15,3);not null" json:"quantity"`
	BuyPrice   float64 `gorm:"type:decimal(15,2);not null" json:"buy_price"`
	Subtotal   float64 `gorm:"type:decimal(15,2);not null" json:"subtotal"`
}

// CreatePurchaseRequest is the request body for creating a purchase order.
type CreatePurchaseRequest struct {
	SupplierID uint                      `json:"supplier_id" binding:"required"`
	Notes      string                    `json:"notes"`
	Items      []CreatePurchaseItemInput `json:"items" binding:"required,min=1,dive"`
}

type CreatePurchaseItemInput struct {
	ProductID uint    `json:"product_id" binding:"required"`
	Quantity  float64 `json:"quantity" binding:"required,min=0.001"`
	BuyPrice  float64 `json:"buy_price" binding:"required,min=0"`
}
