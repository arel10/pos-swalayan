package main

import (
	"fmt"
	"log"
	"os"

	"github.com/arel10/pos-swalayan/internal/database"
	"github.com/arel10/pos-swalayan/internal/middleware"
	"github.com/arel10/pos-swalayan/internal/modules/audit"
	"github.com/arel10/pos-swalayan/internal/modules/auth"
	"github.com/arel10/pos-swalayan/internal/modules/categories"
	"github.com/arel10/pos-swalayan/internal/modules/dashboard"
	"github.com/arel10/pos-swalayan/internal/modules/inventory"
	"github.com/arel10/pos-swalayan/internal/modules/products"
	"github.com/arel10/pos-swalayan/internal/modules/purchases"
	"github.com/arel10/pos-swalayan/internal/modules/reports"
	"github.com/arel10/pos-swalayan/internal/modules/sales"
	"github.com/arel10/pos-swalayan/internal/modules/shifts"
	"github.com/arel10/pos-swalayan/internal/modules/suppliers"
	"github.com/arel10/pos-swalayan/internal/modules/units"
	"github.com/arel10/pos-swalayan/internal/modules/users"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Connect to database
	db, err := database.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto-migrate
	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Seed default data
	if err := database.Seed(db); err != nil {
		log.Fatalf("Failed to seed database: %v", err)
	}

	// Setup Gin
	if os.Getenv("APP_ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Trust proxies
	r.SetTrustedProxies(nil)

	// Global CORS middleware — must be registered before route groups
	r.Use(middleware.CORS())

	// API v1 group
	api := r.Group("/api/v1")

	// Register all module routes
	auth.RegisterRoutes(api, db)
	users.RegisterRoutes(api, db)
	categories.RegisterRoutes(api, db)
	units.RegisterRoutes(api, db)
	products.RegisterRoutes(api, db)
	suppliers.RegisterRoutes(api, db)
	purchases.RegisterRoutes(api, db)
	inventory.RegisterRoutes(api, db)
	sales.RegisterRoutes(api, db)
	shifts.RegisterRoutes(api, db)
	reports.RegisterRoutes(api, db)
	dashboard.RegisterRoutes(api, db)
	audit.RegisterRoutes(api, db)

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 POS Swalayan API running on :%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
