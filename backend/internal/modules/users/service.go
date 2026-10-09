package users

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// Service handles business logic for users.
type Service struct {
	repo *Repository
}

// NewService creates a new user service.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetAll(page, perPage int, search string) ([]User, int64, error) {
	return s.repo.FindAll(page, perPage, search)
}

func (s *Service) GetByID(id uint) (*User, error) {
	return s.repo.FindByID(id)
}

func (s *Service) GetRoles() ([]Role, error) {
	return s.repo.FindAllRoles()
}

func (s *Service) Create(req CreateUserRequest) (*User, error) {
	if s.repo.UsernameExists(req.Username, 0) {
		return nil, fmt.Errorf("username '%s' sudah digunakan", req.Username)
	}

	role, err := s.repo.FindRoleByID(req.RoleID)
	if err != nil {
		return nil, err
	}
	if role == nil {
		return nil, fmt.Errorf("role tidak ditemukan")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &User{
		Name:     req.Name,
		Username: req.Username,
		Password: string(hash),
		RoleID:   req.RoleID,
		Status:   "ACTIVE",
	}

	if err := s.repo.Create(user); err != nil {
		return nil, err
	}

	return s.repo.FindByID(user.ID)
}

func (s *Service) Update(id uint, req UpdateUserRequest) (*User, error) {
	user, err := s.repo.FindByID(id)
	if err != nil || user == nil {
		return nil, fmt.Errorf("user tidak ditemukan")
	}

	updates := map[string]any{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}

	if err := s.repo.Update(user, updates); err != nil {
		return nil, err
	}

	return s.repo.FindByID(id)
}

func (s *Service) ResetPassword(id uint, req ResetPasswordRequest) error {
	user, err := s.repo.FindByID(id)
	if err != nil || user == nil {
		return fmt.Errorf("user tidak ditemukan")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.repo.Update(user, map[string]any{"password": string(hash)})
}
