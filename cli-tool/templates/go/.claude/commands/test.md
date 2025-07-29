# Go Test Runner

Run Go tests with coverage reporting and benchmarks.

## Purpose

This command helps you run Go tests effectively with proper configuration, coverage analysis, and performance benchmarking.

## Usage

```
/test $ARGUMENTS
```

## What this command does

1. **Runs unit tests** with proper configuration
2. **Generates coverage reports** in multiple formats
3. **Executes benchmarks** for performance analysis
4. **Provides detailed test results** with failure analysis

## Example Commands

### Basic Testing
```bash
# Run all tests
go test ./...

# Run tests with verbose output
go test -v ./...

# Run specific package tests
go test ./internal/service

# Run specific test function
go test -run TestUserService ./internal/service
```

### Coverage Testing
```bash
# Run tests with coverage
go test -cover ./...

# Generate detailed coverage report
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html

# Set coverage mode (set, count, atomic)
go test -covermode=count -coverprofile=coverage.out ./...

# Coverage for specific packages
go test -coverprofile=coverage.out ./internal/...
```

### Race Detection
```bash
# Run tests with race detector
go test -race ./...

# Combine race detection with coverage
go test -race -coverprofile=coverage.out ./...
```

### Benchmarking
```bash
# Run all benchmarks
go test -bench=. ./...

# Run benchmarks with memory stats
go test -bench=. -benchmem ./...

# Run specific benchmark
go test -bench=BenchmarkProcessData ./internal/service

# Compare benchmarks
go test -bench=. -count=5 ./... > old.txt
# After changes...
go test -bench=. -count=5 ./... > new.txt
benchcmp old.txt new.txt
```

### Advanced Testing
```bash
# Run tests multiple times
go test -count=10 ./...

# Run tests with timeout
go test -timeout=30s ./...

# Run tests in parallel
go test -parallel=4 ./...

# Generate test binary without running
go test -c ./internal/service
```

## Test Organization

### Table-Driven Tests
```go
func TestUserValidation(t *testing.T) {
    testCases := []struct {
        name        string
        user        User
        expectError bool
        errorMsg    string
    }{
        {
            name:        "valid user",
            user:        User{Name: "John", Email: "john@example.com"},
            expectError: false,
        },
        {
            name:        "empty name",
            user:        User{Name: "", Email: "john@example.com"},
            expectError: true,
            errorMsg:    "name is required",
        },
    }

    for _, tc := range testCases {
        t.Run(tc.name, func(t *testing.T) {
            err := ValidateUser(tc.user)
            if tc.expectError {
                if err == nil {
                    t.Errorf("expected error but got none")
                }
                if err.Error() != tc.errorMsg {
                    t.Errorf("expected error '%s', got '%s'", tc.errorMsg, err.Error())
                }
            } else {
                if err != nil {
                    t.Errorf("unexpected error: %v", err)
                }
            }
        })
    }
}
```

### Subtests and Test Setup
```go
func TestUserService(t *testing.T) {
    // Setup
    db := setupTestDB(t)
    defer db.Close()
    
    service := NewUserService(db)
    
    t.Run("CreateUser", func(t *testing.T) {
        user := User{Name: "John", Email: "john@example.com"}
        err := service.CreateUser(user)
        if err != nil {
            t.Errorf("unexpected error: %v", err)
        }
    })
    
    t.Run("GetUser", func(t *testing.T) {
        user, err := service.GetUser(1)
        if err != nil {
            t.Errorf("unexpected error: %v", err)
        }
        if user.Name != "John" {
            t.Errorf("expected name 'John', got '%s'", user.Name)
        }
    })
}
```

## Mocking and Test Doubles

### Interface-Based Mocking
```go
//go:generate mockgen -source=user.go -destination=mocks/user_mock.go

type UserRepository interface {
    GetUser(id int) (User, error)
    CreateUser(user User) error
}

func TestUserService_GetUser(t *testing.T) {
    ctrl := gomock.NewController(t)
    defer ctrl.Finish()
    
    mockRepo := mocks.NewMockUserRepository(ctrl)
    mockRepo.EXPECT().GetUser(1).Return(User{ID: 1, Name: "John"}, nil)
    
    service := NewUserService(mockRepo)
    user, err := service.GetUser(1)
    
    if err != nil {
        t.Errorf("unexpected error: %v", err)
    }
    if user.Name != "John" {
        t.Errorf("expected name 'John', got '%s'", user.Name)
    }
}
```

## Coverage Goals

### Coverage Thresholds
```bash
# Check coverage threshold
go test -coverprofile=coverage.out ./...
go tool cover -func=coverage.out | grep total | awk '{if ($3 < 80.0) exit 1}'
```

### Coverage by Package
```bash
# Generate coverage for each package
for pkg in $(go list ./...); do
    echo "Coverage for $pkg:"
    go test -coverprofile=profile.out $pkg
    go tool cover -func=profile.out | tail -1
done
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run tests
  run: |
    go test -race -coverprofile=coverage.out -covermode=atomic ./...
    go tool cover -html=coverage.out -o coverage.html

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage.out
```

## Best Practices

- Aim for 80%+ test coverage
- Use table-driven tests for multiple scenarios
- Test both happy path and error cases
- Mock external dependencies
- Run tests with race detector enabled
- Use meaningful test names that describe the scenario
- Keep tests isolated and independent
- Test public APIs, not implementation details