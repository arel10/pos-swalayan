package users

import (
	"errors"

	"gorm.io/gorm"
)

// Repository handles database operations for users.
type Repository struct {
	db *gorm.DB
}

// NewRepository creates a new user repository.
func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindAll(page, perPage int, search string) ([]User, int64, error) {
	var users []User
	var total int64

	q := r.db.Preload("Role")
	if search != "" {
		q = q.Where("name LIKE ? OR username LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	q.Model(&User{}).Count(&total)
	err := q.Offset((page - 1) * perPage).Limit(perPage).Find(&users).Error
	return users, total, err
}

func (r *Repository) FindByID(id uint) (*User, error) {
	var user User
	err := r.db.Preload("Role").First(&user, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (r *Repository) FindByUsername(username string) (*User, error) {
	var user User
	err := r.db.Preload("Role").Where("username = ?", username).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (r *Repository) Create(user *User) error {
	return r.db.Create(user).Error
}

func (r *Repository) Update(user *User, updates map[string]any) error {
	return r.db.Model(user).Updates(updates).Error
}

func (r *Repository) UsernameExists(username string, excludeID uint) bool {
	var count int64
	q := r.db.Model(&User{}).Where("username = ?", username)
	if excludeID > 0 {
		q = q.Where("id != ?", excludeID)
	}
	q.Count(&count)
	return count > 0
}

func (r *Repository) FindRoleByID(id uint) (*Role, error) {
	var role Role
	err := r.db.First(&role, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &role, err
}

func (r *Repository) FindAllRoles() ([]Role, error) {
	var roles []Role
	err := r.db.Find(&roles).Error
	return roles, err
}
