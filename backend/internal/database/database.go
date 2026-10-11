package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/arel10/pos-swalayan/internal/modules/audit"
	"github.com/arel10/pos-swalayan/internal/modules/categories"
	"github.com/arel10/pos-swalayan/internal/modules/inventory"
	"github.com/arel10/pos-swalayan/internal/modules/products"
	"github.com/arel10/pos-swalayan/internal/modules/purchases"
	"github.com/arel10/pos-swalayan/internal/modules/sales"
	"github.com/arel10/pos-swalayan/internal/modules/shifts"
	"github.com/arel10/pos-swalayan/internal/modules/suppliers"
	"github.com/arel10/pos-swalayan/internal/modules/units"
	"github.com/arel10/pos-swalayan/internal/modules/users"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect creates a new database connection using environment variables.
func Connect() (*gorm.DB, error) {
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}

	sslMode := os.Getenv("DB_SSLMODE")
	if sslMode == "" {
		sslMode = "disable"
	}

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Jakarta",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		port,
		sslMode,
	)

	logLevel := logger.Silent
	if os.Getenv("APP_ENV") != "production" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
		NowFunc: func() time.Time {
			return time.Now().Local()
		},
	})
	if err != nil {
		return nil, fmt.Errorf("connecting to postgresql: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)

	log.Println("✅ Database connected")
	return db, nil
}

// AutoMigrate runs GORM auto-migration for all models.
func AutoMigrate(db *gorm.DB) error {
	log.Println("⚙️  Running auto-migration...")
	return db.AutoMigrate(
		&users.Role{},
		&users.User{},
		&categories.Category{},
		&units.Unit{},
		&products.Product{},
		&suppliers.Supplier{},
		&purchases.Purchase{},
		&purchases.PurchaseItem{},
		&inventory.StockMovement{},
		&sales.Sale{},
		&sales.SaleItem{},
		&sales.Payment{},
		&shifts.CashierShift{},
		&audit.AuditLog{},
	)
}

// Seed inserts default data if not already present.
func Seed(db *gorm.DB) error {
	// Seed roles
	roles := []users.Role{
		{Name: "admin"},
		{Name: "kasir"},
	}
	for i := range roles {
		db.Where(users.Role{Name: roles[i].Name}).FirstOrCreate(&roles[i])
	}

	// Seed default admin user
	var adminRole users.Role
	db.Where("name = ?", "admin").First(&adminRole)

	var count int64
	db.Model(&users.User{}).Count(&count)
	if count == 0 {
		hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		admin := users.User{
			Name:     "Administrator",
			Username: "admin",
			Password: string(hash),
			RoleID:   adminRole.ID,
			Status:   "ACTIVE",
		}
		db.Create(&admin)
		log.Println("👤 Default admin created: username=admin password=admin123")
	}

	// Seed default category
	defaultCat := categories.Category{Name: "Umum"}
	db.Where(categories.Category{Name: "Umum"}).FirstOrCreate(&defaultCat)

	// Seed default unit
	defaultUnit := units.Unit{Name: "PCS", Abbreviation: "pcs"}
	db.Where(units.Unit{Name: "PCS"}).FirstOrCreate(&defaultUnit)

	return nil
}
