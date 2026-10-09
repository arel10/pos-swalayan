package users

import (
	"time"
)

// Role represents user roles in the system.
type Role struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"uniqueIndex;size:50" json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// User represents a system user (Admin or Kasir).
type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	Username  string    `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Password  string    `gorm:"not null" json:"-"`
	RoleID    uint      `gorm:"not null" json:"role_id"`
	Role      *Role     `gorm:"foreignKey:RoleID" json:"role,omitempty"`
	Status    string    `gorm:"type:enum('ACTIVE','INACTIVE');default:'ACTIVE'" json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CreateUserRequest is the request body for creating a user.
type CreateUserRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
	RoleID   uint   `json:"role_id" binding:"required"`
}

// UpdateUserRequest is the request body for updating a user.
type UpdateUserRequest struct {
	Name   string `json:"name" binding:"omitempty,min=2,max=100"`
	Status string `json:"status" binding:"omitempty,oneof=ACTIVE INACTIVE"`
}

// ResetPasswordRequest is the request body for resetting a password.
type ResetPasswordRequest struct {
	Password string `json:"password" binding:"required,min=6"`
}

// UserResponse is the public representation of a user.
type UserResponse struct {
	ID        uint      `json:"id"`
	Name      string    `json:"name"`
	Username  string    `json:"username"`
	RoleID    uint      `json:"role_id"`
	Role      *Role     `json:"role,omitempty"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}
