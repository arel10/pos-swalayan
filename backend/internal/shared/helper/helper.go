package helper

import (
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"
)

// GenerateSaleNumber generates a unique sale number like TRX-20240101-XXXX.
func GenerateSaleNumber() string {
	now := time.Now()
	uid := uuid.New().String()[:8]
	return fmt.Sprintf("TRX-%s-%s", now.Format("20060102"), uid)
}

// GeneratePurchaseNumber generates a unique purchase order number.
func GeneratePurchaseNumber() string {
	now := time.Now()
	uid := uuid.New().String()[:8]
	return fmt.Sprintf("PO-%s-%s", now.Format("20060102"), uid)
}

// Paginate returns offset and limit from page and perPage.
func Paginate(page, perPage int) (offset, limit int) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	offset = (page - 1) * perPage
	limit = perPage
	return
}

// TotalPage calculates total pages.
func TotalPage(total int64, perPage int) int {
	return int(math.Ceil(float64(total) / float64(perPage)))
}

// StrPtr returns a pointer to a string.
func StrPtr(s string) *string { return &s }
