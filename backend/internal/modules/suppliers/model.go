package suppliers

import "time"

// Supplier represents a product supplier.
type Supplier struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:150;not null" json:"name"`
	Phone     string    `gorm:"size:50" json:"phone"`
	Email     string    `gorm:"size:100" json:"email"`
	Address   string    `gorm:"type:text" json:"address"`
	Status    string    `gorm:"type:enum('ACTIVE','INACTIVE');default:'ACTIVE'" json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateSupplierRequest struct {
	Name    string `json:"name" binding:"required,min=2,max=150"`
	Phone   string `json:"phone" binding:"omitempty,max=50"`
	Email   string `json:"email" binding:"omitempty,email,max=100"`
	Address string `json:"address"`
}

type UpdateSupplierRequest struct {
	Name    string `json:"name" binding:"omitempty,min=2,max=150"`
	Phone   string `json:"phone" binding:"omitempty,max=50"`
	Email   string `json:"email" binding:"omitempty,email,max=100"`
	Address string `json:"address"`
	Status  string `json:"status" binding:"omitempty,oneof=ACTIVE INACTIVE"`
}
