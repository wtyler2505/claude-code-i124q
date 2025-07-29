# Go Build

Build your Go application with optimization and cross-compilation support.

## Purpose

This command helps you build Go applications efficiently with proper flags, optimization, and cross-platform support.

## Usage

```
/build $ARGUMENTS
```

## What this command does

1. **Compiles Go code** with optimization flags
2. **Cross-compiles** for different platforms if specified
3. **Strips debug info** for production builds
4. **Generates build artifacts** in organized structure

## Example Commands

### Basic Build
```bash
# Build for current platform
go build -o app ./cmd/main.go

# Build with optimizations (production)
go build -ldflags="-w -s" -o app ./cmd/main.go

# Build all packages
go build ./...
```

### Cross-Platform Build
```bash
# Build for Linux
GOOS=linux GOARCH=amd64 go build -o app-linux ./cmd/main.go

# Build for Windows
GOOS=windows GOARCH=amd64 go build -o app.exe ./cmd/main.go

# Build for macOS
GOOS=darwin GOARCH=amd64 go build -o app-darwin ./cmd/main.go

# Build for ARM64
GOOS=linux GOARCH=arm64 go build -o app-arm64 ./cmd/main.go
```

### Build with Version Info
```bash
# Embed version information
VERSION=$(git describe --tags --always)
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
go build -ldflags="-X main.Version=$VERSION -X main.BuildTime=$BUILD_TIME" -o app ./cmd/main.go
```

### Production Build Script
```bash
#!/bin/bash
# build.sh
set -e

APP_NAME="myapp"
VERSION=$(git describe --tags --always --dirty)
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS="-w -s -X main.Version=$VERSION -X main.BuildTime=$BUILD_TIME"

echo "Building $APP_NAME version $VERSION..."

# Clean previous builds
rm -rf build/

# Build for multiple platforms
platforms=("linux/amd64" "darwin/amd64" "windows/amd64")

for platform in "${platforms[@]}"
do
    platform_split=(${platform//\// })
    GOOS=${platform_split[0]}
    GOARCH=${platform_split[1]}
    
    output_name=$APP_NAME'-'$GOOS'-'$GOARCH
    if [ "$GOOS" = "windows" ]; then
        output_name+='.exe'
    fi
    
    echo "Building for $platform..."
    env GOOS=$GOOS GOARCH=$GOARCH go build -ldflags="$LDFLAGS" -o build/$output_name ./cmd/main.go
done

echo "Build complete. Artifacts in build/ directory."
```

## Build Flags Reference

### Optimization Flags
- `-ldflags="-w"` - Strip debug info
- `-ldflags="-s"` - Strip symbol table
- `-trimpath` - Remove file system paths from binaries

### Development Flags
- `-race` - Enable race detector
- `-v` - Verbose output
- `-x` - Print build commands
- `-work` - Print temporary work directory

### Cross-Compilation Variables
- `GOOS` - Target operating system
- `GOARCH` - Target architecture
- `CGO_ENABLED` - Enable/disable CGO (0 or 1)

## Best Practices

- Use `-ldflags="-w -s"` for production builds
- Enable race detector during development: `go build -race`
- Use build constraints for platform-specific code
- Version your binaries with git tags
- Create reproducible builds with consistent environments
- Test cross-compiled binaries on target platforms