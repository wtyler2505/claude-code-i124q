# Gin Web Framework

Generate and manage Gin web framework components and routes.

## Purpose

This command helps you create Gin web applications with best practices, middleware, and proper project structure.

## Usage

```
/gin $ARGUMENTS
```

## What this command does

1. **Creates Gin route handlers** with proper structure
2. **Generates middleware** for common functionalities
3. **Sets up API endpoints** with validation and error handling
4. **Provides testing utilities** for Gin applications

## Example Commands

### Basic Server Setup
```go
package main

import (
    "github.com/gin-gonic/gin"
    "log"
    "net/http"
)

func main() {
    // Create Gin router
    r := gin.Default()
    
    // Basic route
    r.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "status": "healthy",
            "service": "my-api",
        })
    })
    
    // Start server
    log.Fatal(r.Run(":8080"))
}
```

### RESTful API Structure
```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
    "strconv"
)

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name" binding:"required"`
    Email string `json:"email" binding:"required,email"`
}

var users []User
var nextID = 1

func main() {
    r := gin.Default()
    
    // User routes
    api := r.Group("/api/v1")
    {
        api.GET("/users", getUsers)
        api.GET("/users/:id", getUser)
        api.POST("/users", createUser)
        api.PUT("/users/:id", updateUser)
        api.DELETE("/users/:id", deleteUser)
    }
    
    r.Run(":8080")
}

func getUsers(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"users": users})
}

func getUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
        return
    }
    
    for _, user := range users {
        if user.ID == id {
            c.JSON(http.StatusOK, user)
            return
        }
    }
    
    c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
}

func createUser(c *gin.Context) {
    var user User
    if err := c.ShouldBindJSON(&user); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    user.ID = nextID
    nextID++
    users = append(users, user)
    
    c.JSON(http.StatusCreated, user)
}

func updateUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
        return
    }
    
    var updatedUser User
    if err := c.ShouldBindJSON(&updatedUser); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    for i, user := range users {
        if user.ID == id {
            updatedUser.ID = id
            users[i] = updatedUser
            c.JSON(http.StatusOK, updatedUser)
            return
        }
    }
    
    c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
}

func deleteUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
        return
    }
    
    for i, user := range users {
        if user.ID == id {
            users = append(users[:i], users[i+1:]...)
            c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
            return
        }
    }
    
    c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
}
```

### Middleware Examples
```go
package middleware

import (
    "github.com/gin-gonic/gin"
    "log"
    "time"
)

// Logger middleware
func Logger() gin.HandlerFunc {
    return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
        return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
            param.ClientIP,
            param.TimeStamp.Format(time.RFC1123),
            param.Method,
            param.Path,
            param.Request.Proto,
            param.StatusCode,
            param.Latency,
            param.Request.UserAgent(),
            param.ErrorMessage,
        )
    })
}

// CORS middleware
func CORS() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("Access-Control-Allow-Origin", "*")
        c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        
        c.Next()
    }
}

// Authentication middleware
func AuthRequired() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.JSON(401, gin.H{"error": "Authorization header required"})
            c.Abort()
            return
        }
        
        // Validate token (implement your logic)
        if !validateToken(token) {
            c.JSON(401, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }
        
        c.Next()
    }
}

// Rate limiting middleware
func RateLimit() gin.HandlerFunc {
    // Implementation using golang.org/x/time/rate
    return func(c *gin.Context) {
        // Rate limiting logic
        c.Next()
    }
}
```

### Error Handling
```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

type APIError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Details string `json:"details,omitempty"`
}

func errorMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()
        
        // Check if there are any errors
        if len(c.Errors) > 0 {
            err := c.Errors.Last()
            
            switch err.Type {
            case gin.ErrorTypeBind:
                c.JSON(http.StatusBadRequest, APIError{
                    Code:    http.StatusBadRequest,
                    Message: "Invalid request data",
                    Details: err.Error(),
                })
            case gin.ErrorTypePublic:
                c.JSON(http.StatusInternalServerError, APIError{
                    Code:    http.StatusInternalServerError,
                    Message: "Internal server error",
                })
            default:
                c.JSON(http.StatusInternalServerError, APIError{
                    Code:    http.StatusInternalServerError,
                    Message: "Something went wrong",
                })
            }
        }
    }
}

func main() {
    r := gin.Default()
    r.Use(errorMiddleware())
    
    r.GET("/error", func(c *gin.Context) {
        c.Error(errors.New("something went wrong"))
    })
    
    r.Run(":8080")
}
```

### Database Integration
```go
package main

import (
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
    "gorm.io/driver/postgres"
)

type User struct {
    ID    uint   `json:"id" gorm:"primaryKey"`
    Name  string `json:"name" binding:"required"`
    Email string `json:"email" binding:"required,email" gorm:"unique"`
}

var db *gorm.DB

func initDB() {
    var err error
    dsn := "host=localhost user=username password=password dbname=mydb port=5432 sslmode=disable"
    db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        panic("failed to connect database")
    }
    
    // Auto-migrate schema
    db.AutoMigrate(&User{})
}

func createUser(c *gin.Context) {
    var user User
    if err := c.ShouldBindJSON(&user); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    if err := db.Create(&user).Error; err != nil {
        c.JSON(500, gin.H{"error": "Failed to create user"})
        return
    }
    
    c.JSON(201, user)
}

func getUsers(c *gin.Context) {
    var users []User
    if err := db.Find(&users).Error; err != nil {
        c.JSON(500, gin.H{"error": "Failed to fetch users"})
        return
    }
    
    c.JSON(200, users)
}

func main() {
    initDB()
    
    r := gin.Default()
    r.POST("/users", createUser)
    r.GET("/users", getUsers)
    
    r.Run(":8080")
}
```

### Testing Gin Applications
```go
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
)

func setupRouter() *gin.Engine {
    gin.SetMode(gin.TestMode)
    r := gin.Default()
    
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "healthy"})
    })
    
    r.POST("/users", func(c *gin.Context) {
        var user User
        if err := c.ShouldBindJSON(&user); err != nil {
            c.JSON(400, gin.H{"error": err.Error()})
            return
        }
        c.JSON(201, user)
    })
    
    return r
}

func TestHealthEndpoint(t *testing.T) {
    router := setupRouter()
    
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/health", nil)
    router.ServeHTTP(w, req)
    
    assert.Equal(t, 200, w.Code)
    assert.Contains(t, w.Body.String(), "healthy")
}

func TestCreateUser(t *testing.T) {
    router := setupRouter()
    
    user := User{Name: "John", Email: "john@example.com"}
    jsonValue, _ := json.Marshal(user)
    
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("POST", "/users", bytes.NewBuffer(jsonValue))
    req.Header.Set("Content-Type", "application/json")
    router.ServeHTTP(w, req)
    
    assert.Equal(t, 201, w.Code)
    
    var response User
    json.Unmarshal(w.Body.Bytes(), &response)
    assert.Equal(t, "John", response.Name)
    assert.Equal(t, "john@example.com", response.Email)
}

func TestCreateUserValidation(t *testing.T) {
    router := setupRouter()
    
    // Invalid user (missing required fields)
    user := User{}
    jsonValue, _ := json.Marshal(user)
    
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("POST", "/users", bytes.NewBuffer(jsonValue))
    req.Header.Set("Content-Type", "application/json")
    router.ServeHTTP(w, req)
    
    assert.Equal(t, 400, w.Code)
}
```

### Configuration Management
```go
package config

import (
    "os"
    "strconv"
)

type Config struct {
    Port         string
    DatabaseURL  string
    JWTSecret    string
    Environment  string
    LogLevel     string
}

func Load() *Config {
    return &Config{
        Port:        getEnv("PORT", "8080"),
        DatabaseURL: getEnv("DATABASE_URL", "postgres://localhost/mydb"),
        JWTSecret:   getEnv("JWT_SECRET", "your-secret-key"),
        Environment: getEnv("ENVIRONMENT", "development"),
        LogLevel:    getEnv("LOG_LEVEL", "info"),
    }
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
    if value := os.Getenv(key); value != "" {
        if intValue, err := strconv.Atoi(value); err == nil {
            return intValue
        }
    }
    return defaultValue
}
```

## Best Practices

### Project Structure
```
project/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── handler/
│   │   ├── user.go
│   │   └── auth.go
│   ├── middleware/
│   │   ├── auth.go
│   │   └── cors.go
│   ├── model/
│   │   └── user.go
│   ├── service/
│   │   └── user.go
│   └── repository/
│       └── user.go
├── pkg/
│   └── config/
│       └── config.go
├── api/
│   └── openapi.yaml
├── docker/
│   └── Dockerfile
├── go.mod
├── go.sum
└── README.md
```

### Performance Tips
- Use `gin.SetMode(gin.ReleaseMode)` in production
- Implement connection pooling for databases
- Use middleware for common functionalities
- Implement proper logging and monitoring
- Use context for request scoping
- Validate inputs early
- Handle errors gracefully
- Use appropriate HTTP status codes
- Implement rate limiting for public APIs
- Use HTTPS in production