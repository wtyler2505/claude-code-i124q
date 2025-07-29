# Go Security Analysis

Run security analysis and vulnerability scanning for Go applications.

## Purpose

This command helps you identify and fix security vulnerabilities in your Go code using comprehensive security tools and best practices.

## Usage

```
/security $ARGUMENTS
```

## What this command does

1. **Scans for security vulnerabilities** using gosec
2. **Checks for known CVEs** with govulncheck
3. **Analyzes dependencies** for security issues
4. **Provides security recommendations** and fixes

## Example Commands

### Basic Security Scanning
```bash
# Install gosec
go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest

# Run security scan
gosec ./...

# Run with specific rules
gosec -include=G101,G102,G103 ./...

# Exclude specific rules
gosec -exclude=G104 ./...

# Output in different formats
gosec -fmt=json ./...
gosec -fmt=yaml ./...
gosec -fmt=csv ./...
```

### Vulnerability Checking
```bash
# Install govulncheck
go install golang.org/x/vuln/cmd/govulncheck@latest

# Check for known vulnerabilities
govulncheck ./...

# Check specific package
govulncheck -package github.com/gin-gonic/gin

# Check with verbose output
govulncheck -v ./...

# Output in JSON format
govulncheck -json ./...
```

### Comprehensive Security Audit
```bash
#!/bin/bash
# security-audit.sh
set -e

echo "🔍 Running comprehensive security audit..."

# 1. Static security analysis
echo "→ Running gosec static analysis..."
if command -v gosec >/dev/null 2>&1; then
    gosec -fmt=json -out=gosec-report.json ./...
    gosec ./...
else
    echo "  gosec not found. Install with: go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest"
fi

# 2. Vulnerability scanning
echo "→ Checking for known vulnerabilities..."
if command -v govulncheck >/dev/null 2>&1; then
    govulncheck ./...
else
    echo "  govulncheck not found. Install with: go install golang.org/x/vuln/cmd/govulncheck@latest"
fi

# 3. Dependency audit
echo "→ Auditing dependencies..."
go list -m -json all | jq -r 'select(.Version != null) | .Path + " " + .Version' > dependencies.txt
echo "  Dependencies saved to dependencies.txt"

# 4. License checking
echo "→ Checking licenses..."
if command -v go-licenses >/dev/null 2>&1; then
    go-licenses check ./...
else
    echo "  go-licenses not found. Install with: go install github.com/google/go-licenses@latest"
fi

echo "✅ Security audit complete!"
```

## Common Security Issues

### 1. Hardcoded Credentials (G101)
```go
// ❌ BAD: Hardcoded password
const password = "supersecret123"

// ❌ BAD: Hardcoded API key
var apiKey = "ak-1234567890abcdef"

// ✅ GOOD: Use environment variables
func getPassword() string {
    return os.Getenv("PASSWORD")
}

// ✅ GOOD: Use configuration
type Config struct {
    APIKey string `env:"API_KEY"`
}
```

### 2. SQL Injection (G201, G202)
```go
// ❌ BAD: SQL injection vulnerability
func getUserByID(db *sql.DB, userID string) (*User, error) {
    query := fmt.Sprintf("SELECT * FROM users WHERE id = %s", userID)
    row := db.QueryRow(query)
    // ...
}

// ✅ GOOD: Use prepared statements
func getUserByID(db *sql.DB, userID string) (*User, error) {
    query := "SELECT * FROM users WHERE id = ?"
    row := db.QueryRow(query, userID)
    // ...
}

// ✅ GOOD: With GORM
func getUserByID(db *gorm.DB, userID uint) (*User, error) {
    var user User
    err := db.First(&user, userID).Error
    return &user, err
}
```

### 3. Command Injection (G204)
```go
// ❌ BAD: Command injection vulnerability
func executeCommand(userInput string) error {
    cmd := exec.Command("sh", "-c", userInput)
    return cmd.Run()
}

// ✅ GOOD: Validate and sanitize input
func executeCommand(command string, args []string) error {
    // Whitelist allowed commands
    allowedCommands := map[string]bool{
        "ls":   true,
        "pwd":  true,
        "date": true,
    }
    
    if !allowedCommands[command] {
        return errors.New("command not allowed")
    }
    
    cmd := exec.Command(command, args...)
    return cmd.Run()
}
```

### 4. File Path Traversal (G304)
```go
// ❌ BAD: Path traversal vulnerability
func readFile(filename string) ([]byte, error) {
    return ioutil.ReadFile(filename)
}

// ✅ GOOD: Validate file paths
func readFile(filename string) ([]byte, error) {
    // Clean the path
    cleanPath := filepath.Clean(filename)
    
    // Ensure path is within allowed directory
    allowedDir := "/var/www/uploads"
    if !strings.HasPrefix(cleanPath, allowedDir) {
        return nil, errors.New("access denied")
    }
    
    return ioutil.ReadFile(cleanPath)
}
```

### 5. Weak Random Number Generation (G404)
```go
// ❌ BAD: Weak random number generation
func generateToken() string {
    rand.Seed(time.Now().UnixNano())
    token := make([]byte, 32)
    for i := range token {
        token[i] = byte(rand.Intn(256))
    }
    return hex.EncodeToString(token)
}

// ✅ GOOD: Use crypto/rand
func generateToken() (string, error) {
    token := make([]byte, 32)
    _, err := rand.Read(token)
    if err != nil {
        return "", err
    }
    return hex.EncodeToString(token), nil
}
```

### 6. TLS Configuration (G402, G403)
```go
// ❌ BAD: Insecure TLS configuration
func createHTTPSClient() *http.Client {
    tr := &http.Transport{
        TLSClientConfig: &tls.Config{
            InsecureSkipVerify: true, // DON'T DO THIS
        },
    }
    return &http.Client{Transport: tr}
}

// ✅ GOOD: Secure TLS configuration
func createHTTPSClient() *http.Client {
    tr := &http.Transport{
        TLSClientConfig: &tls.Config{
            MinVersion: tls.VersionTLS12,
            CipherSuites: []uint16{
                tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
                tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
                tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
            },
        },
    }
    return &http.Client{Transport: tr}
}
```

## Security Best Practices

### Input Validation
```go
package validation

import (
    "fmt"
    "regexp"
    "strings"
)

func ValidateEmail(email string) error {
    if len(email) == 0 {
        return fmt.Errorf("email is required")
    }
    
    if len(email) > 254 {
        return fmt.Errorf("email too long")
    }
    
    emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
    if !emailRegex.MatchString(email) {
        return fmt.Errorf("invalid email format")
    }
    
    return nil
}

func SanitizeString(input string) string {
    // Remove dangerous characters
    input = strings.ReplaceAll(input, "<script>", "")
    input = strings.ReplaceAll(input, "</script>", "")
    input = strings.ReplaceAll(input, "javascript:", "")
    
    return strings.TrimSpace(input)
}
```

### Authentication and Authorization
```go
package auth

import (
    "crypto/subtle"
    "errors"
    "time"
    
    "github.com/golang-jwt/jwt/v4"
    "golang.org/x/crypto/bcrypt"
)

type Claims struct {
    UserID string `json:"user_id"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

func HashPassword(password string) (string, error) {
    hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    return string(hash), err
}

func CheckPassword(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}

func GenerateJWT(userID, role, secret string) (string, error) {
    claims := Claims{
        UserID: userID,
        Role:   role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Subject:   userID,
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(secret))
}

func ValidateJWT(tokenString, secret string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        return []byte(secret), nil
    })
    
    if err != nil {
        return nil, err
    }
    
    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        return claims, nil
    }
    
    return nil, errors.New("invalid token")
}

// Secure string comparison to prevent timing attacks
func SecureCompare(a, b string) bool {
    return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}
```

### Secure Configuration Management
```go
package config

import (
    "crypto/rand"
    "encoding/hex"
    "os"
    "strconv"
    "time"
)

type SecurityConfig struct {
    JWTSecret          string
    PasswordMinLength  int
    SessionTimeout     time.Duration
    RateLimitRequests  int
    RateLimitWindow    time.Duration
    TLSMinVersion      uint16
    CSRFTokenLength    int
}

func LoadSecurityConfig() *SecurityConfig {
    return &SecurityConfig{
        JWTSecret:         getEnvOrGenerate("JWT_SECRET", 32),
        PasswordMinLength: getEnvAsInt("PASSWORD_MIN_LENGTH", 8),
        SessionTimeout:    getEnvAsDuration("SESSION_TIMEOUT", "24h"),
        RateLimitRequests: getEnvAsInt("RATE_LIMIT_REQUESTS", 100),
        RateLimitWindow:   getEnvAsDuration("RATE_LIMIT_WINDOW", "1h"),
        CSRFTokenLength:   getEnvAsInt("CSRF_TOKEN_LENGTH", 32),
    }
}

func getEnvOrGenerate(key string, length int) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    
    // Generate secure random value
    bytes := make([]byte, length)
    if _, err := rand.Read(bytes); err != nil {
        panic("failed to generate random value: " + err.Error())
    }
    
    return hex.EncodeToString(bytes)
}

func getEnvAsInt(key string, defaultValue int) int {
    if value := os.Getenv(key); value != "" {
        if intValue, err := strconv.Atoi(value); err == nil {
            return intValue
        }
    }
    return defaultValue
}

func getEnvAsDuration(key, defaultValue string) time.Duration {
    if value := os.Getenv(key); value != "" {
        if duration, err := time.ParseDuration(value); err == nil {
            return duration
        }
    }
    
    duration, _ := time.ParseDuration(defaultValue)
    return duration
}
```

## Security Testing

### Security Test Examples
```go
package security_test

import (
    "testing"
    "time"
)

func TestPasswordHashing(t *testing.T) {
    password := "testpassword123"
    
    // Test hashing
    hash, err := HashPassword(password)
    if err != nil {
        t.Fatalf("failed to hash password: %v", err)
    }
    
    // Test verification
    if !CheckPassword(password, hash) {
        t.Error("password verification failed")
    }
    
    // Test wrong password
    if CheckPassword("wrongpassword", hash) {
        t.Error("wrong password was accepted")
    }
}

func TestJWTGeneration(t *testing.T) {
    secret := "test-secret-key"
    userID := "user123"
    role := "admin"
    
    // Generate token
    token, err := GenerateJWT(userID, role, secret)
    if err != nil {
        t.Fatalf("failed to generate JWT: %v", err)
    }
    
    // Validate token
    claims, err := ValidateJWT(token, secret)
    if err != nil {
        t.Fatalf("failed to validate JWT: %v", err)
    }
    
    if claims.UserID != userID {
        t.Errorf("expected user ID %s, got %s", userID, claims.UserID)
    }
    
    if claims.Role != role {
        t.Errorf("expected role %s, got %s", role, claims.Role)
    }
}

func TestRateLimiting(t *testing.T) {
    // Test rate limiting implementation
    limiter := NewRateLimiter(5, time.Minute)
    
    // Should allow first 5 requests
    for i := 0; i < 5; i++ {
        if !limiter.Allow("test-ip") {
            t.Errorf("request %d should be allowed", i+1)
        }
    }
    
    // 6th request should be blocked
    if limiter.Allow("test-ip") {
        t.Error("6th request should be blocked")
    }
}
```

## Automated Security Scanning

### GitHub Actions Security Workflow
```yaml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-go@v3
      with:
        go-version: 1.21
    
    - name: Install security tools
      run: |
        go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest
        go install golang.org/x/vuln/cmd/govulncheck@latest
    
    - name: Run gosec
      run: gosec -fmt=sarif -out=gosec.sarif ./...
    
    - name: Run govulncheck
      run: govulncheck ./...
    
    - name: Upload SARIF file
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: gosec.sarif
```

## Best Practices

- Run security scans in CI/CD pipelines
- Use environment variables for sensitive configuration
- Implement proper input validation
- Use prepared statements for database queries
- Enable TLS for all network communications
- Implement rate limiting for public APIs
- Use secure random number generation
- Hash passwords with bcrypt or similar
- Validate JWTs properly
- Keep dependencies up to date
- Follow principle of least privilege
- Log security events for monitoring
- Implement proper error handling without information disclosure