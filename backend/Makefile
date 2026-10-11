.PHONY: run build tidy

# Copy env if not exists
init:
	@if not exist .env copy .env.example .env
	@echo .env created. Please configure your database settings.

# Run the server
run:
	go run ./cmd/main.go

# Build binary
build:
	go build -o pos-swalayan.exe ./cmd/main.go

# Download dependencies
tidy:
	go mod tidy

# Download dependencies
deps:
	go get github.com/gin-gonic/gin@v1.10.0
	go get github.com/golang-jwt/jwt/v5@v5.2.1
	go get github.com/joho/godotenv@v1.5.1
	go get golang.org/x/crypto@v0.23.0
	go get gorm.io/driver/postgres@v1.5.7
	go get gorm.io/gorm@v1.25.10
	go get github.com/google/uuid@v1.6.0
	go mod tidy
