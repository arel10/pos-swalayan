package sales

import (
	"time"
)

// Sale represents a completed sales transaction header.
type Sale struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	SaleNumber     string    `gorm:"uniqueIndex;size:50;not null" json:"sale_number"`
	CashierID      uint      `gorm:"not null" json:"cashier_id"`
	ShiftID        uint      `json:"shift_id"`
	Status         string    `gorm:"size:20;default:'COMPLETED'" json:"status"`
	TotalAmount    float64   `gorm:"type:decimal(15,2)" json:"total_amount"`
	DiscountAmount float64   `gorm:"type:decimal(15,2);default:0" json:"discount_amount"`
	FinalAmount    float64   `gorm:"type:decimal(15,2)" json:"final_amount"`
	PaidAmount     float64   `gorm:"type:decimal(15,2)" json:"paid_amount"`
	ChangeAmount   float64   `gorm:"type:decimal(15,2);default:0" json:"change_amount"`
	Notes          string    `gorm:"type:text" json:"notes"`
	VoidReason     string    `gorm:"type:text" json:"void_reason"`
	VoidedAt       *time.Time `json:"voided_at"`
	VoidedByID     *uint     `json:"voided_by_id"`
	Items          []SaleItem `gorm:"foreignKey:SaleID" json:"items,omitempty"`
	Payment        *Payment  `gorm:"foreignKey:SaleID" json:"payment,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// SaleItem represents a line item in a sale.
type SaleItem struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	SaleID    uint    `gorm:"not null;index" json:"sale_id"`
	ProductID uint    `gorm:"not null" json:"product_id"`
	Name      string  `gorm:"size:200" json:"name"` // snapshot of product name
	Barcode   string  `gorm:"size:100" json:"barcode"`
	Quantity  float64 `gorm:"type:decimal(15,3);not null" json:"quantity"`
	UnitPrice float64 `gorm:"type:decimal(15,2);not null" json:"unit_price"`
	Subtotal  float64 `gorm:"type:decimal(15,2);not null" json:"subtotal"`
}

// Payment represents the payment for a sale.
type Payment struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	SaleID        uint      `gorm:"uniqueIndex;not null" json:"sale_id"`
	Method        string    `gorm:"size:20;default:'CASH'" json:"method"`
	Amount        float64   `gorm:"type:decimal(15,2);not null" json:"amount"`
	ChangeAmount  float64   `gorm:"type:decimal(15,2);default:0" json:"change_amount"`
	CreatedAt     time.Time `json:"created_at"`
}

// CheckoutRequest is the request body for a POS checkout.
type CheckoutRequest struct {
	ShiftID        uint                `json:"shift_id" binding:"required"`
	Items          []CheckoutItemInput `json:"items" binding:"required,min=1,dive"`
	PaymentMethod  string              `json:"payment_method" binding:"required,oneof=CASH QRIS DEBIT TRANSFER"`
	PaidAmount     float64             `json:"paid_amount" binding:"required,min=0"`
	DiscountAmount float64             `json:"discount_amount" binding:"min=0"`
	Notes          string              `json:"notes"`
}

type CheckoutItemInput struct {
	ProductID uint    `json:"product_id" binding:"required"`
	Quantity  float64 `json:"quantity" binding:"required,min=0.001"`
}

// VoidRequest is the request body for voiding a sale.
type VoidRequest struct {
	Reason string `json:"reason" binding:"required,min=5"`
}
