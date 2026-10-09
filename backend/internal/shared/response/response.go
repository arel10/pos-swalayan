package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Meta holds pagination metadata.
type Meta struct {
	Page      int   `json:"page"`
	PerPage   int   `json:"per_page"`
	Total     int64 `json:"total"`
	TotalPage int   `json:"total_page"`
}

// Success sends a successful JSON response.
func Success(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    data,
	})
}

// SuccessWithMeta sends a successful JSON response with pagination metadata.
func SuccessWithMeta(c *gin.Context, data any, meta Meta) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    data,
		"meta":    meta,
	})
}

// Created sends a 201 Created JSON response.
func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    data,
	})
}

// Error sends a JSON error response.
func Error(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, gin.H{
		"success": false,
		"error":   message,
	})
}

// BadRequest sends a 400 Bad Request JSON response.
func BadRequest(c *gin.Context, message string) {
	Error(c, http.StatusBadRequest, message)
}

// Unauthorized sends a 401 Unauthorized JSON response.
func Unauthorized(c *gin.Context, message string) {
	Error(c, http.StatusUnauthorized, message)
}

// Forbidden sends a 403 Forbidden JSON response.
func Forbidden(c *gin.Context) {
	Error(c, http.StatusForbidden, "Anda tidak memiliki izin untuk akses ini")
}

// NotFound sends a 404 Not Found JSON response.
func NotFound(c *gin.Context, message string) {
	Error(c, http.StatusNotFound, message)
}

// Conflict sends a 409 Conflict JSON response.
func Conflict(c *gin.Context, message string) {
	Error(c, http.StatusConflict, message)
}

// InternalError sends a 500 Internal Server Error JSON response.
func InternalError(c *gin.Context) {
	Error(c, http.StatusInternalServerError, "Terjadi kesalahan internal server")
}

// ValidationError sends a 422 Unprocessable Entity JSON response.
func ValidationError(c *gin.Context, errors any) {
	c.JSON(http.StatusUnprocessableEntity, gin.H{
		"success": false,
		"error":   "Validasi gagal",
		"details": errors,
	})
}
