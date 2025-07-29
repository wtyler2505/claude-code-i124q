# Go Development with Claude Code

Your comprehensive companion for Go development, featuring best practices, modern tooling, and framework-specific optimizations.

## 🚀 Quick Start

```bash
# Initialize a new Go module
go mod init your-project

# Install dependencies
go mod tidy

# Run your application
go run main.go

# Build for production
go build -o app ./cmd/main.go
```

## 📁 Project Structure

### Standard Go Project Layout

```
your-project/
├── cmd/                    # Main applications
│   └── main.go            # Application entry point
├── internal/              # Private application code
│   ├── handler/           # HTTP handlers
│   ├── service/           # Business logic
│   ├── repository/        # Data access layer
│   └── model/             # Data models
├── pkg/                   # Public library code
├── api/                   # API definitions (OpenAPI/gRPC)
├── web/                   # Web assets
├── configs/               # Configuration files
├── scripts/               # Build and deploy scripts
├── test/                  # Integration tests
├── docs/                  # Documentation
├── go.mod                 # Module definition
├── go.sum                 # Module checksums
├── Makefile               # Build automation
└── README.md              # Project documentation
```

## 🛠 Available Commands

Use these slash commands for common Go development tasks:

### Core Development
- `/build` - Build your Go application with optimizations
- `/test` - Run tests with coverage reporting
- `/lint` - Run Go linters and formatters (gofmt, golint, staticcheck)
- `/benchmark` - Run performance benchmarks
- `/mod` - Manage Go modules and dependencies

### Framework-Specific
- `/gin` - Create Gin web server components
- `/echo` - Generate Echo framework handlers
- `/fiber` - Build Fiber application routes
- `/grpc` - Generate gRPC services and clients

### Code Quality
- `/security` - Run security analysis with gosec
- `/profile` - Generate performance profiles
- `/docs` - Generate documentation with godoc

## 🏗 Framework Integration

### Gin Web Framework
```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func main() {
    r := gin.Default()
    r.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"status": "healthy"})
    })
    r.Run(":8080")
}
```

### Echo Framework
```go
package main

import (
    "github.com/labstack/echo/v4"
    "net/http"
)

func main() {
    e := echo.New()
    e.GET("/health", func(c echo.Context) error {
        return c.JSON(http.StatusOK, map[string]string{"status": "healthy"})
    })
    e.Start(":8080")
}
```

### Fiber Framework
```go
package main

import (
    "github.com/gofiber/fiber/v2"
)

func main() {
    app := fiber.New()
    app.Get("/health", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{"status": "healthy"})
    })
    app.Listen(":8080")
}
```

## 🧪 Testing Best Practices

### Unit Testing
```go
func TestUserService(t *testing.T) {
    tests := []struct {
        name     string
        input    User
        expected error
    }{
        {
            name:     "valid user",
            input:    User{Name: "John", Email: "john@example.com"},
            expected: nil,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateUser(tt.input)
            if err != tt.expected {
                t.Errorf("expected %v, got %v", tt.expected, err)
            }
        })
    }
}
```

### Benchmarking
```go
func BenchmarkProcessData(b *testing.B) {
    data := generateTestData(1000)
    b.ResetTimer()
    
    for i := 0; i < b.N; i++ {
        ProcessData(data)
    }
}
```

## 🔧 Development Tools

### Essential Tools
- **gofmt** - Code formatting
- **golint** - Style linting  
- **staticcheck** - Advanced static analysis
- **gosec** - Security analysis
- **go mod** - Dependency management
- **go test** - Testing framework
- **pprof** - Performance profiling

### IDE Integration
- **gopls** - Go language server
- **dlv** - Delve debugger
- **goimports** - Import management

## 🚀 Performance Optimization

### Memory Management
```go
// Use sync.Pool for frequent allocations
var bufferPool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 0, 1024)
    },
}

// Reuse slices efficiently
func processData(data []Item) {
    buf := bufferPool.Get().([]byte)
    defer bufferPool.Put(buf[:0])
    
    // Process data...
}
```

### Concurrency Patterns
```go
// Worker pool pattern
func processItems(items []Item) {
    const numWorkers = 10
    jobs := make(chan Item, len(items))
    results := make(chan Result, len(items))

    // Start workers
    for w := 0; w < numWorkers; w++ {
        go worker(jobs, results)
    }

    // Send jobs
    for _, item := range items {
        jobs <- item
    }
    close(jobs)

    // Collect results
    for range items {
        <-results
    }
}
```

## 📚 Best Practices

### Code Organization
- Keep packages small and focused
- Use interfaces for abstraction
- Follow naming conventions (camelCase, avoid underscores)
- Document public APIs with comments
- Use context.Context for cancellation and timeouts

### Error Handling
```go
// Wrap errors with context
if err != nil {
    return fmt.Errorf("failed to process user %s: %w", userID, err)
}

// Check for specific error types
var validationErr *ValidationError
if errors.As(err, &validationErr) {
    // Handle validation error specifically
}
```

### Security
- Validate all inputs
- Use prepared statements for database queries
- Implement proper authentication and authorization
- Keep dependencies updated
- Use `gosec` for security scanning

## 🔨 Build and Deployment

### Build Configuration
```makefile
# Makefile
.PHONY: build test lint clean

APP_NAME=myapp
BUILD_DIR=build

build:
	CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o $(BUILD_DIR)/$(APP_NAME) ./cmd/main.go

test:
	go test -v -race -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

lint:
	gofmt -s -w .
	golint ./...
	staticcheck ./...

clean:
	rm -rf $(BUILD_DIR)
```

### Docker Integration
```dockerfile
# Multi-stage build
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
```

## 🔗 Useful Resources

- [Go Documentation](https://golang.org/doc/)
- [Effective Go](https://golang.org/doc/effective_go.html)
- [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- [Standard Go Project Layout](https://github.com/golang-standards/project-layout)

---

*Happy Go development! 🎯*