package products

import (
	"time"
)

// Product represents a product in the store.
type Product struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	SKU          string    `gorm:"uniqueIndex;size:100;not null" json:"sku"`
	Barcode      string    `gorm:"uniqueIndex;size:100" json:"barcode"`
	Name         string    `gorm:"size:200;not null" json:"name"`
	CategoryID   uint      `gorm:"not null" json:"category_id"`
	UnitID       uint      `gorm:"not null" json:"unit_id"`
	BuyPrice     float64   `gorm:"type:decimal(15,2);not null" json:"buy_price"`
	SellPrice    float64   `gorm:"type:decimal(15,2);not null" json:"sell_price"`
	Stock        float64   `gorm:"type:decimal(15,3);default:0" json:"stock"`
	MinStock     float64   `gorm:"type:decimal(15,3);default:0" json:"min_stock"`
	Status       string    `gorm:"type:enum('ACTIVE','INACTIVE');default:'ACTIVE'" json:"status"`
	Description  string    `gorm:"type:text" json:"description"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// CreateProductRequest is the request body for creating a product.
type CreateProductRequest struct {
	SKU         string  `json:"sku" binding:"required,max=100"`
	Barcode     string  `json:"barcode" binding:"omitempty,max=100"`
	Name        string  `json:"name" binding:"required,min=2,max=200"`
	CategoryID  uint    `json:"category_id" binding:"required"`
	UnitID      uint    `json:"unit_id" binding:"required"`
	BuyPrice    float64 `json:"buy_price" binding:"required,min=0"`
	SellPrice   float64 `json:"sell_price" binding:"required,min=0"`
	MinStock    float64 `json:"min_stock" binding:"min=0"`
	Description string  `json:"description"`
}

// UpdateProductRequest is the request body for updating a product.
type UpdateProductRequest struct {
	Name        string  `json:"name" binding:"omitempty,min=2,max=200"`
	CategoryID  uint    `json:"category_id"`
	UnitID      uint    `json:"unit_id"`
	BuyPrice    float64 `json:"buy_price" binding:"omitempty,min=0"`
	SellPrice   float64 `json:"sell_price" binding:"omitempty,min=0"`
	MinStock    float64 `json:"min_stock" binding:"omitempty,min=0"`
	Status      string  `json:"status" binding:"omitempty,oneof=ACTIVE INACTIVE"`
	Description string  `json:"description"`
}
