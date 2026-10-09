package categories

import "time"

// Category represents a product category.
type Category struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"uniqueIndex;size:100;not null" json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateCategoryRequest struct {
	Name string `json:"name" binding:"required,min=2,max=100"`
}

type UpdateCategoryRequest struct {
	Name string `json:"name" binding:"required,min=2,max=100"`
}
