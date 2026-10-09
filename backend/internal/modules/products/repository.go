package products

import (
	"errors"

	"gorm.io/gorm"
)

// Repository handles database operations for products.
type Repository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

func (r *Repository) FindAll(page, perPage int, search, status string) ([]Product, int64, error) {
	var products []Product
	var total int64

	q := r.db.Model(&Product{})
	if search != "" {
		q = q.Where("name LIKE ? OR sku LIKE ? OR barcode LIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}

	q.Count(&total)
	err := q.Offset((page - 1) * perPage).Limit(perPage).Find(&products).Error
	return products, total, err
}

func (r *Repository) FindByID(id uint) (*Product, error) {
	var p Product
	err := r.db.First(&p, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &p, err
}

func (r *Repository) FindByBarcode(barcode string) (*Product, error) {
	var p Product
	err := r.db.Where("barcode = ?", barcode).First(&p).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &p, err
}

func (r *Repository) FindActiveBySKUOrBarcode(query string) ([]Product, error) {
	var products []Product
	err := r.db.Where(
		"status = 'ACTIVE' AND (sku LIKE ? OR barcode = ? OR name LIKE ?)",
		"%"+query+"%", query, "%"+query+"%",
	).Limit(20).Find(&products).Error
	return products, err
}

func (r *Repository) FindLowStock() ([]Product, error) {
	var products []Product
	err := r.db.Where("status = 'ACTIVE' AND stock <= min_stock").Find(&products).Error
	return products, err
}

func (r *Repository) SKUExists(sku string, excludeID uint) bool {
	var count int64
	q := r.db.Model(&Product{}).Where("sku = ?", sku)
	if excludeID > 0 {
		q = q.Where("id != ?", excludeID)
	}
	q.Count(&count)
	return count > 0
}

func (r *Repository) BarcodeExists(barcode string, excludeID uint) bool {
	if barcode == "" {
		return false
	}
	var count int64
	q := r.db.Model(&Product{}).Where("barcode = ?", barcode)
	if excludeID > 0 {
		q = q.Where("id != ?", excludeID)
	}
	q.Count(&count)
	return count > 0
}

func (r *Repository) Create(p *Product) error { return r.db.Create(p).Error }

func (r *Repository) Update(p *Product, updates map[string]any) error {
	return r.db.Model(p).Updates(updates).Error
}

// UpdateStock adds or subtracts stock. Use within DB transactions.
func (r *Repository) UpdateStock(db *gorm.DB, productID uint, delta float64) error {
	return db.Model(&Product{}).Where("id = ?", productID).
		UpdateColumn("stock", gorm.Expr("stock + ?", delta)).Error
}
