# Go Module Management

Manage Go modules, dependencies, and versioning.

## Purpose

This command helps you manage Go modules effectively, including dependency management, version control, and module maintenance.

## Usage

```
/mod $ARGUMENTS
```

## What this command does

1. **Manages module dependencies** with proper versioning
2. **Updates and maintains** go.mod and go.sum files
3. **Resolves dependency conflicts** and vulnerabilities
4. **Optimizes module performance** with proper caching

## Example Commands

### Module Initialization
```bash
# Initialize new module
go mod init github.com/username/project

# Initialize with custom module path
go mod init example.com/myproject

# Initialize in existing directory
go mod init .
```

### Dependency Management
```bash
# Add dependency (latest version)
go get github.com/gin-gonic/gin

# Add specific version
go get github.com/gin-gonic/gin@v1.9.1

# Add development version
go get github.com/gin-gonic/gin@master

# Add with version constraint
go get github.com/gin-gonic/gin@>=v1.9.0

# Add for testing only
go get -t github.com/stretchr/testify
```

### Module Maintenance
```bash
# Download dependencies
go mod download

# Update dependencies
go mod tidy

# Update all dependencies to latest
go get -u ./...

# Update only minor/patch versions
go get -u=patch ./...

# Remove unused dependencies
go mod tidy
```

### Dependency Information
```bash
# List all modules
go list -m all

# Show module graph
go mod graph

# Show why a dependency is needed
go mod why github.com/gin-gonic/gin

# Verify checksums
go mod verify

# Show module information
go list -m -json github.com/gin-gonic/gin
```

### Version Management
```bash
# List available versions
go list -m -versions github.com/gin-gonic/gin

# Upgrade to specific version
go get github.com/gin-gonic/gin@v1.9.1

# Downgrade to previous version
go get github.com/gin-gonic/gin@v1.8.2

# Use replace directive for local development
go mod edit -replace github.com/myorg/mylib=../mylib

# Remove replace directive
go mod edit -dropreplace github.com/myorg/mylib
```

## Module Structure

### go.mod File
```go
module github.com/username/project

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/lib/pq v1.10.9
    golang.org/x/crypto v0.12.0
)

require (
    // Indirect dependencies
    github.com/bytedance/sonic v1.9.1 // indirect
    github.com/chenzhuoyu/base64x v0.0.0-20221115062448-fe3a3abad311 // indirect
)

replace github.com/old/package => github.com/new/package v1.0.0

exclude github.com/problematic/package v1.2.3

retract v1.0.1 // Contains security vulnerability
```

### Module Directives Explained
- `module` - Module path
- `go` - Minimum Go version required
- `require` - Direct dependencies
- `replace` - Replace dependency with another version/location
- `exclude` - Exclude specific versions
- `retract` - Mark versions as retracted

## Working with Private Modules

### GOPRIVATE Configuration
```bash
# Set private module prefixes
go env -w GOPRIVATE=github.com/myorg/*,gitlab.com/mycompany/*

# Configure git for private repos
git config --global url.ssh://git@github.com/.insteadOf https://github.com/

# Use .netrc for HTTPS authentication
echo "machine github.com login username password token" >> ~/.netrc
```

### Go Modules Proxy
```bash
# Disable proxy for private modules
go env -w GOPROXY=https://proxy.golang.org,direct
go env -w GOPRIVATE=github.com/myorg/*

# Use custom proxy
go env -w GOPROXY=https://myproxy.company.com,https://proxy.golang.org,direct
```

## Module Development Workflow

### Local Development
```bash
# Use local version during development
go mod edit -replace github.com/myorg/mylib=../mylib
go mod tidy

# Test with local changes
go test ./...

# Remove replace before release
go mod edit -dropreplace github.com/myorg/mylib
go mod tidy
```

### Multi-Module Repository
```
project/
├── go.mod              # Root module
├── cmd/
│   └── app/
│       └── main.go
├── internal/
│   └── service/
├── pkg/
│   └── utils/
│       ├── go.mod      # Utils module
│       └── utils.go
└── tools/
    ├── go.mod          # Tools module
    └── gen.go
```

## Dependency Security

### Vulnerability Scanning
```bash
# Install govulncheck
go install golang.org/x/vuln/cmd/govulncheck@latest

# Scan for vulnerabilities
govulncheck ./...

# Check specific package
govulncheck -package github.com/gin-gonic/gin
```

### Dependency Auditing
```bash
# List all dependencies with versions
go list -m -json all | jq -r '.Path + " " + .Version'

# Check license compatibility
go-licenses check ./...

# Generate dependency report
go list -m -json all > dependencies.json
```

## Module Performance

### Build Cache
```bash
# Clean module cache
go clean -modcache

# Download all dependencies
go mod download all

# Warm up build cache
go build -a ./...
```

### Vendor Directory
```bash
# Create vendor directory
go mod vendor

# Build using vendor
go build -mod=vendor ./...

# Verify vendor consistency
go mod verify
```

## Troubleshooting

### Common Issues and Solutions

#### Module Not Found
```bash
# Check GOPROXY settings
go env GOPROXY

# Clear module cache
go clean -modcache

# Force refresh
go get -d github.com/problematic/module@latest
```

#### Version Conflicts
```bash
# Show conflict details
go mod graph | grep problematic-package

# Use specific version
go get github.com/package@v1.2.3

# Use replace directive
go mod edit -replace github.com/old=github.com/new@v1.0.0
```

#### Checksum Mismatch
```bash
# Clear sum database
rm go.sum
go mod tidy

# Verify checksums
go mod verify

# Download missing checksums
go mod download
```

## Advanced Module Features

### Module Queries
```bash
# Get latest version
go list -m -versions github.com/gin-gonic/gin | tr ' ' '\n' | tail -1

# Get all versions
go list -m -versions github.com/gin-gonic/gin

# Get module info
go list -m -json github.com/gin-gonic/gin@latest
```

### Module Publishing
```bash
# Tag version for release
git tag v1.0.0
git push origin v1.0.0

# Pre-release version
git tag v1.1.0-beta.1
git push origin v1.1.0-beta.1

# Major version (v2+)
go mod edit -module github.com/myorg/myproject/v2
```

## Best Practices

- Keep go.mod and go.sum in version control
- Use semantic versioning for releases
- Regularly update dependencies with `go mod tidy`
- Pin major versions in go.mod
- Use replace directives sparingly
- Scan for vulnerabilities regularly
- Document breaking changes clearly
- Test with different Go versions
- Use GOPRIVATE for internal modules
- Clean module cache periodically to save disk space