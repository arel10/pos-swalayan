package units

import "time"

// Unit represents a product measurement unit (e.g., PCS, KG, LITER).
type Unit struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"uniqueIndex;size:50;not null" json:"name"`
	Abbreviation string    `gorm:"size:20" json:"abbreviation"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateUnitRequest struct {
	Name         string `json:"name" binding:"required,min=1,max=50"`
	Abbreviation string `json:"abbreviation" binding:"omitempty,max=20"`
}

type UpdateUnitRequest struct {
	Name         string `json:"name" binding:"omitempty,min=1,max=50"`
	Abbreviation string `json:"abbreviation" binding:"omitempty,max=20"`
}
