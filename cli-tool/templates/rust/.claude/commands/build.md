# Rust Build

Build your Rust application with optimization, cross-compilation, and feature management.

## Purpose

This command helps you build Rust applications efficiently with proper optimization flags, cross-platform support, and feature selection.

## Usage

```
/build $ARGUMENTS
```

## What this command does

1. **Compiles Rust code** with optimization and feature flags
2. **Cross-compiles** for different platforms and architectures
3. **Manages features** and conditional compilation
4. **Generates optimized binaries** for production deployment

## Example Commands

### Basic Build
```bash
# Build for current platform
cargo build

# Build with release optimizations
cargo build --release

# Build specific binary
cargo build --bin my-app

# Build all binaries
cargo build --bins

# Build with verbose output
cargo build --verbose
```

### Feature Management
```bash
# Build with specific features
cargo build --features "feature1,feature2"

# Build with all features
cargo build --all-features

# Build with no default features
cargo build --no-default-features

# Build with specific feature combination
cargo build --no-default-features --features "serde,async"
```

### Cross-Compilation
```bash
# Install target first
rustup target add x86_64-unknown-linux-gnu

# Cross-compile for Linux
cargo build --target x86_64-unknown-linux-gnu --release

# Cross-compile for Windows
rustup target add x86_64-pc-windows-gnu
cargo build --target x86_64-pc-windows-gnu --release

# Cross-compile for macOS
rustup target add x86_64-apple-darwin
cargo build --target x86_64-apple-darwin --release

# Cross-compile for ARM64
rustup target add aarch64-unknown-linux-gnu
cargo build --target aarch64-unknown-linux-gnu --release
```

### Production Build Script
```bash
#!/bin/bash
# build.sh
set -e

APP_NAME="my-rust-app"
VERSION=$(git describe --tags --always --dirty)

echo "Building $APP_NAME version $VERSION..."

# Clean previous builds
cargo clean

# Build for multiple targets
targets=(
    "x86_64-unknown-linux-gnu"
    "x86_64-apple-darwin"
    "x86_64-pc-windows-gnu"
    "aarch64-unknown-linux-gnu"
)

for target in "${targets[@]}"; do
    echo "Building for $target..."
    
    # Ensure target is installed
    rustup target add "$target"
    
    # Build with optimizations
    cargo build --release --target "$target"
    
    # Create distribution directory
    mkdir -p "dist/$target"
    
    # Copy binary to dist
    if [[ "$target" == *"windows"* ]]; then
        cp "target/$target/release/${APP_NAME}.exe" "dist/$target/"
    else
        cp "target/$target/release/${APP_NAME}" "dist/$target/"
    fi
done

echo "Build complete. Binaries available in dist/ directory."
```

### Docker Build
```dockerfile
# Multi-stage Dockerfile for optimized Rust builds
FROM rust:1.75 AS builder

WORKDIR /app
COPY . .

# Build dependencies separately for better caching
RUN cargo build --release --bin my-app

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/my-app /usr/local/bin/my-app

EXPOSE 8080
CMD ["my-app"]
```

## Build Profiles

### Custom Profile Configuration
```toml
# Cargo.toml
[profile.dev]
debug = true
opt-level = 0
overflow-checks = true

[profile.release]
debug = false
opt-level = 3
lto = true
codegen-units = 1
panic = 'abort'
strip = true

[profile.profiling]
inherits = "release"
debug = true
strip = false

[profile.bench]
inherits = "release"
debug = true
```

### Build with Custom Profile
```bash
# Build with profiling profile
cargo build --profile profiling

# Build for benchmarking
cargo build --profile bench
```

## Advanced Build Options

### Link Time Optimization (LTO)
```bash
# Enable LTO for smaller, faster binaries
RUSTFLAGS="-C lto=fat" cargo build --release

# Enable thin LTO (faster compile, good optimization)
RUSTFLAGS="-C lto=thin" cargo build --release
```

### Target-specific Optimizations
```bash
# Optimize for current CPU
RUSTFLAGS="-C target-cpu=native" cargo build --release

# Optimize for specific CPU features
RUSTFLAGS="-C target-feature=+avx2,+fma" cargo build --release
```

### Memory-safe Release Builds
```bash
# Build with additional security features
RUSTFLAGS="-C relocation-model=pie -C link-arg=-pie" cargo build --release

# Build with stack overflow protection
RUSTFLAGS="-C link-arg=-Wl,-z,stack-size=2097152" cargo build --release
```

## Workspace Builds

### Building Workspace Members
```bash
# Build all workspace members
cargo build --workspace

# Build specific workspace member
cargo build --package my-lib

# Build multiple packages
cargo build --package my-lib --package my-app

# Exclude specific packages
cargo build --workspace --exclude integration-tests
```

## Build Caching

### Using sccache for Faster Builds
```bash
# Install sccache
cargo install sccache

# Set environment variable
export RUSTC_WRAPPER=sccache

# Build with caching
cargo build --release

# Check cache statistics
sccache --show-stats
```

### Using cargo-chef for Docker Builds
```dockerfile
FROM rust:1.75 AS planner
WORKDIR /app
RUN cargo install cargo-chef
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM rust:1.75 AS cacher
WORKDIR /app
RUN cargo install cargo-chef
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

FROM rust:1.75 AS builder
WORKDIR /app
COPY . .
COPY --from=cacher /app/target target
RUN cargo build --release --bin my-app
```

## Error Handling and Debugging

### Build with Debug Information
```bash
# Build with debug symbols
cargo build --release --config 'profile.release.debug=true'

# Build with backtrace support
RUST_BACKTRACE=1 cargo build
```

### Common Build Flags
```bash
# Show all compiler warnings
cargo build -- -W warnings

# Treat warnings as errors
cargo build -- -D warnings

# Show timing information
cargo build --timings

# Show dependency tree
cargo build --unit-graph
```

## Build Scripts

### Custom Build Script (build.rs)
```rust
use std::env;
use std::path::PathBuf;

fn main() {
    // Tell Cargo to rerun if build.rs changes
    println!("cargo:rerun-if-changed=build.rs");
    
    // Set version from git
    let output = std::process::Command::new("git")
        .args(&["describe", "--tags", "--always", "--dirty"])
        .output()
        .unwrap();
    
    let version = String::from_utf8(output.stdout).unwrap();
    println!("cargo:rustc-env=GIT_VERSION={}", version.trim());
    
    // Link native library
    println!("cargo:rustc-link-lib=sqlite3");
    
    // Set custom cfg flags
    if env::var("PROFILE").unwrap() == "release" {
        println!("cargo:rustc-cfg=release_build");
    }
}
```

## Best Practices

### Optimization Guidelines
- Use `--release` for production builds
- Enable LTO for maximum optimization
- Use `strip = true` to reduce binary size
- Consider `panic = 'abort'` for smaller binaries
- Use `codegen-units = 1` for maximum optimization

### Cross-Compilation Tips
- Install targets with `rustup target add`
- Use `cross` crate for complex cross-compilation
- Test cross-compiled binaries on target platforms
- Consider using Docker for consistent builds

### Build Performance
- Use `sccache` for compilation caching
- Leverage `cargo-chef` for Docker builds
- Split dependencies and application code builds
- Use parallel compilation with `-j` flag
- Consider incremental compilation for development

### Security Considerations
- Use `cargo audit` to check for vulnerabilities
- Enable overflow checks in debug builds
- Use `strip = true` to remove debug symbols
- Consider Position Independent Executables (PIE)
- Regular dependency updates with `cargo update`