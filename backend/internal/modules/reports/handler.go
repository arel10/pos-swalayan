package reports

import (
	"time"

	"github.com/arel10/pos-swalayan/internal/middleware"
	"github.com/arel10/pos-swalayan/internal/shared/response"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ---- DTOs ----

type SalesReportRow struct {
	Date         string  `json:"date"`
	TotalSales   float64 `json:"total_sales"`
	Transactions int     `json:"transactions"`
	ItemsSold    float64 `json:"items_sold"`
}

type TopProductRow struct {
	ProductID   uint    `json:"product_id"`
	ProductName string  `json:"product_name"`
	QtySold     float64 `json:"qty_sold"`
	Revenue     float64 `json:"revenue"`
}

type ProfitReportRow struct {
	Date      string  `json:"date"`
	Revenue   float64 `json:"revenue"`
	COGS      float64 `json:"cogs"`
	GrossProfit float64 `json:"gross_profit"`
}

// ---- Service ----

type Service struct{ db *gorm.DB }

func NewService(db *gorm.DB) *Service { return &Service{db: db} }

func (s *Service) SalesReport(startDate, endDate string) ([]SalesReportRow, error) {
	var rows []SalesReportRow
	err := s.db.Raw(`
		SELECT
			DATE(created_at) as date,
			COALESCE(SUM(final_amount), 0) as total_sales,
			COUNT(*) as transactions,
			COALESCE((SELECT SUM(si.quantity) FROM sale_items si WHERE si.sale_id = sales.id), 0) as items_sold
		FROM sales
		WHERE status = 'COMPLETED' AND DATE(created_at) BETWEEN ? AND ?
		GROUP BY DATE(created_at)
		ORDER BY date DESC
	`, startDate, endDate).Scan(&rows).Error
	return rows, err
}

func (s *Service) TopProducts(startDate, endDate string, limit int) ([]TopProductRow, error) {
	if limit <= 0 || limit > 50 {
		limit = 10
	}
	var rows []TopProductRow
	err := s.db.Raw(`
		SELECT
			si.product_id,
			si.name as product_name,
			SUM(si.quantity) as qty_sold,
			SUM(si.subtotal) as revenue
		FROM sale_items si
		JOIN sales s ON s.id = si.sale_id
		WHERE s.status = 'COMPLETED' AND DATE(s.created_at) BETWEEN ? AND ?
		GROUP BY si.product_id, si.name
		ORDER BY qty_sold DESC
		LIMIT ?
	`, startDate, endDate, limit).Scan(&rows).Error
	return rows, err
}

func (s *Service) ProfitReport(startDate, endDate string) ([]ProfitReportRow, error) {
	var rows []ProfitReportRow
	err := s.db.Raw(`
		SELECT
			DATE(s.created_at) as date,
			SUM(si.subtotal) as revenue,
			SUM(si.quantity * p.buy_price) as cogs,
			SUM(si.subtotal) - SUM(si.quantity * p.buy_price) as gross_profit
		FROM sale_items si
		JOIN sales s ON s.id = si.sale_id
		JOIN products p ON p.id = si.product_id
		WHERE s.status = 'COMPLETED' AND DATE(s.created_at) BETWEEN ? AND ?
		GROUP BY DATE(s.created_at)
		ORDER BY date DESC
	`, startDate, endDate).Scan(&rows).Error
	return rows, err
}

// ---- Handler ----

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	svc := NewService(db)
	h := NewHandler(svc)

	reports := rg.Group("/reports", middleware.AuthRequired(), middleware.AdminOnly())
	{
		reports.GET("/sales", h.Sales)
		reports.GET("/top-products", h.TopProducts)
		reports.GET("/profit", h.Profit)
	}
}

func parseDateRange(c *gin.Context) (string, string) {
	today := time.Now().Format("2006-01-02")
	start := c.DefaultQuery("start_date", today)
	end := c.DefaultQuery("end_date", today)
	return start, end
}

func (h *Handler) Sales(c *gin.Context) {
	start, end := parseDateRange(c)
	data, err := h.svc.SalesReport(start, end)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, data)
}

func (h *Handler) TopProducts(c *gin.Context) {
	start, end := parseDateRange(c)
	data, err := h.svc.TopProducts(start, end, 10)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, data)
}

func (h *Handler) Profit(c *gin.Context) {
	start, end := parseDateRange(c)
	data, err := h.svc.ProfitReport(start, end)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, data)
}
