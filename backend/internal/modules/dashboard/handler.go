package dashboard

import (
	"time"

	"github.com/arel10/pos-swalayan/internal/middleware"
	"github.com/arel10/pos-swalayan/internal/shared/response"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// DashboardData holds all KPI values for the dashboard.
type DashboardData struct {
	TodaySales       float64     `json:"today_sales"`
	TodayTransactions int64      `json:"today_transactions"`
	TodayItemsSold   float64     `json:"today_items_sold"`
	GrossProfit      float64     `json:"gross_profit"`
	LowStockCount    int64       `json:"low_stock_count"`
	TopProducts      []TopItem   `json:"top_products"`
	LowStockProducts []StockItem `json:"low_stock_products"`
}

type TopItem struct {
	ProductID   uint    `json:"product_id"`
	ProductName string  `json:"product_name"`
	QtySold     float64 `json:"qty_sold"`
}

type StockItem struct {
	ProductID   uint    `json:"product_id"`
	ProductName string  `json:"product_name"`
	Stock       float64 `json:"stock"`
	MinStock    float64 `json:"min_stock"`
}

// Service handles dashboard data aggregation.
type Service struct{ db *gorm.DB }

func NewService(db *gorm.DB) *Service { return &Service{db: db} }

func (s *Service) GetDashboard() (*DashboardData, error) {
	today := time.Now().Format("2006-01-02")
	data := &DashboardData{}

	// Today's sales total
	s.db.Raw(`
		SELECT COALESCE(SUM(final_amount), 0) FROM sales
		WHERE status = 'COMPLETED' AND DATE(created_at) = ?`, today).Scan(&data.TodaySales)

	// Today's transaction count
	s.db.Raw(`
		SELECT COUNT(*) FROM sales
		WHERE status = 'COMPLETED' AND DATE(created_at) = ?`, today).Scan(&data.TodayTransactions)

	// Today's items sold
	s.db.Raw(`
		SELECT COALESCE(SUM(si.quantity), 0)
		FROM sale_items si JOIN sales s ON s.id = si.sale_id
		WHERE s.status = 'COMPLETED' AND DATE(s.created_at) = ?`, today).Scan(&data.TodayItemsSold)

	// Today's gross profit
	s.db.Raw(`
		SELECT COALESCE(SUM(si.subtotal - si.quantity * p.buy_price), 0)
		FROM sale_items si
		JOIN sales s ON s.id = si.sale_id
		JOIN products p ON p.id = si.product_id
		WHERE s.status = 'COMPLETED' AND DATE(s.created_at) = ?`, today).Scan(&data.GrossProfit)

	// Low stock count
	s.db.Raw(`SELECT COUNT(*) FROM products WHERE status = 'ACTIVE' AND stock <= min_stock`).Scan(&data.LowStockCount)

	// Top 5 products today
	s.db.Raw(`
		SELECT si.product_id, si.name as product_name, SUM(si.quantity) as qty_sold
		FROM sale_items si JOIN sales s ON s.id = si.sale_id
		WHERE s.status = 'COMPLETED' AND DATE(s.created_at) = ?
		GROUP BY si.product_id, si.name
		ORDER BY qty_sold DESC LIMIT 5`, today).Scan(&data.TopProducts)

	// Low stock products
	s.db.Raw(`
		SELECT id as product_id, name as product_name, stock, min_stock
		FROM products WHERE status = 'ACTIVE' AND stock <= min_stock
		ORDER BY stock ASC LIMIT 10`).Scan(&data.LowStockProducts)

	return data, nil
}

// ---- Handler ----

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	svc := NewService(db)
	h := NewHandler(svc)
	rg.GET("/dashboard", middleware.AuthRequired(), h.Get)
}

func (h *Handler) Get(c *gin.Context) {
	data, err := h.svc.GetDashboard()
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, data)
}
