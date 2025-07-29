# Go Linter and Formatter

Run Go code quality tools including formatters, linters, and static analysis.

## Purpose

This command helps you maintain high code quality using Go's comprehensive tooling ecosystem for formatting, linting, and static analysis.

## Usage

```
/lint $ARGUMENTS
```

## What this command does

1. **Formats code** with gofmt and goimports
2. **Runs static analysis** with staticcheck and golint
3. **Performs security analysis** with gosec
4. **Provides actionable feedback** on code quality issues

## Example Commands

### Code Formatting
```bash
# Format all Go files
gofmt -s -w .

# Format and organize imports
goimports -w .

# Check if code is formatted (CI/CD)
gofmt -d . | tee /dev/stderr | wc -l | grep -q "^0$"

# Format specific file
gofmt -s -w main.go
```

### Static Analysis
```bash
# Run staticcheck (comprehensive linter)
staticcheck ./...

# Run go vet (official Go analyzer)
go vet ./...

# Run golint (style linter)
golint ./...

# Check for inefficient assignments
ineffassign ./...

# Check for unused variables/functions
unused ./...
```

### Security Analysis
```bash
# Run gosec security scanner
gosec ./...

# Run with specific rules
gosec -include=G101,G102 ./...

# Output in JSON format
gosec -fmt=json ./...

# Save report to file
gosec -out=security-report.txt ./...
```

### Comprehensive Linting Script
```bash
#!/bin/bash
# lint.sh
set -e

echo "Running Go linters..."

# Format code
echo "→ Formatting code..."
gofmt -s -w .
goimports -w .

# Run go vet
echo "→ Running go vet..."
go vet ./...

# Run staticcheck
echo "→ Running staticcheck..."
if command -v staticcheck >/dev/null 2>&1; then
    staticcheck ./...
else
    echo "  staticcheck not found. Install with: go install honnef.co/go/tools/cmd/staticcheck@latest"
fi

# Run golint
echo "→ Running golint..."
if command -v golint >/dev/null 2>&1; then
    golint ./...
else
    echo "  golint not found. Install with: go install golang.org/x/lint/golint@latest"
fi

# Run gosec
echo "→ Running security analysis..."
if command -v gosec >/dev/null 2>&1; then
    gosec ./...
else
    echo "  gosec not found. Install with: go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest"
fi

# Check for inefficiencies
echo "→ Checking for inefficiencies..."
if command -v ineffassign >/dev/null 2>&1; then
    ineffassign ./...
else
    echo "  ineffassign not found. Install with: go install github.com/gordonklaus/ineffassign@latest"
fi

echo "✓ Linting complete!"
```

## golangci-lint Integration

### Configuration File (.golangci.yml)
```yaml
run:
  timeout: 5m
  tests: true

linters-settings:
  govet:
    check-shadowing: true
  staticcheck:
    go: "1.21"
  gosec:
    excludes:
      - G104 # Audit errors not checked
  gocyclo:
    min-complexity: 15
  dupl:
    threshold: 100

linters:
  enable:
    - staticcheck
    - govet
    - errcheck
    - gosimple
    - ineffassign
    - unused
    - misspell
    - gocritic
    - gocyclo
    - dupl
    - gosec
  disable:
    - typecheck

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - gosec
        - dupl
```

### Running golangci-lint
```bash
# Install golangci-lint
curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin v1.54.2

# Run all enabled linters
golangci-lint run

# Run specific linters
golangci-lint run --enable=govet,staticcheck

# Fix issues automatically where possible
golangci-lint run --fix

# Run with custom config
golangci-lint run -c .golangci.yml
```

## Pre-commit Hooks

### Git Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running pre-commit Go checks..."

# Format code
gofmt -s -w .
goimports -w .

# Add formatted files back to staging
go list -f '{{.Dir}}' ./... | xargs git add

# Run linters
go vet ./...
staticcheck ./...

# Run tests
go test -short ./...

echo "Pre-commit checks passed!"
```

## IDE Integration

### VS Code Settings
```json
{
    "go.useLanguageServer": true,
    "go.lintTool": "golangci-lint",
    "go.lintFlags": ["--fast"],
    "go.formatTool": "goimports",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.organizeImports": true
    }
}
```

### Vim/Neovim with vim-go
```vim
let g:go_fmt_command = "goimports"
let g:go_metalinter_enabled = ['vet', 'golint', 'errcheck']
let g:go_metalinter_autosave = 1
let g:go_highlight_types = 1
let g:go_highlight_fields = 1
let g:go_highlight_functions = 1
```

## Common Issues and Solutions

### Import Formatting
```go
// Bad: Mixed grouping
import (
    "fmt"
    "github.com/gin-gonic/gin"
    "os"
    "myproject/internal/service"
)

// Good: Grouped imports
import (
    "fmt"
    "os"

    "github.com/gin-gonic/gin"

    "myproject/internal/service"
)
```

### Naming Conventions
```go
// Bad: Stuttering
type UserUser struct{}
func (u UserUser) UserMethod() {}

// Good: Clean names
type User struct{}
func (u User) Validate() {}

// Bad: Underscores
var user_name string
func get_user() {}

// Good: CamelCase
var userName string
func getUser() {}
```

## Best Practices

- Run formatters before committing code
- Use staticcheck for comprehensive static analysis
- Configure golangci-lint for team consistency
- Set up pre-commit hooks to catch issues early
- Integrate linting into CI/CD pipelines
- Address linter warnings promptly
- Use `//nolint` comments sparingly and with justification
- Keep linter configuration in version control