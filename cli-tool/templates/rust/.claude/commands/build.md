# Rust Build System

Build Rust projects with cargo, including optimization, cross-compilation, and release builds.

## Purpose

This command helps you build Rust projects efficiently using cargo with proper optimization flags, target specifications, and build configurations.

## Usage

```
/build $ARGUMENTS
```

## What this command does

1. **Compiles Rust code** with cargo build system  
2. **Applies optimizations** for development and release builds
3. **Handles cross-compilation** for different platforms
4. **Manages build profiles** and custom configurations

## Example Commands

### Basic Building
```bash
# Build in debug mode (default)
cargo build

# Build in release mode (optimized)
cargo build --release

# Build all targets (binaries, examples, tests)
cargo build --all-targets

# Build specific binary
cargo build --bin my-app

# Build examples
cargo build --examples
```

### Cross-Compilation
```bash
# List available targets
rustup target list

# Add target for cross-compilation
rustup target add x86_64-pc-windows-gnu
rustup target add aarch64-unknown-linux-gnu
rustup target add x86_64-apple-darwin

# Build for specific target
cargo build --target x86_64-pc-windows-gnu
cargo build --target aarch64-unknown-linux-gnu --release

# Build for multiple targets
cargo build --target x86_64-unknown-linux-gnu --target x86_64-pc-windows-gnu
```

### Advanced Build Options
```bash
# Build with specific profile
cargo build --profile dev
cargo build --profile release

# Build with feature flags
cargo build --features "feature1,feature2"
cargo build --all-features
cargo build --no-default-features

# Verbose build output
cargo build --verbose

# Build with specific number of parallel jobs
cargo build --jobs 4

# Build and run
cargo run
cargo run --release
cargo run --bin my-binary -- --arg1 value1
```

## Build Profiles

### Cargo.toml Configuration
```toml
[package]
name = "my-project"
version = "0.1.0"
edition = "2021"

# Development profile (cargo build)
[profile.dev]
opt-level = 0        # No optimizations
debug = true         # Include debug info
split-debuginfo = '...' # Platform-specific debug info handling
strip = false        # Don't strip symbols
debug-assertions = true
overflow-checks = true
lto = false         # No link-time optimization
panic = 'unwind'    # Panic strategy
incremental = true  # Incremental compilation
codegen-units = 256 # Number of codegen units

# Release profile (cargo build --release)
[profile.release]
opt-level = 3       # Maximum optimizations
debug = false       # No debug info
strip = true        # Strip symbols
debug-assertions = false
overflow-checks = false
lto = true         # Link-time optimization
panic = 'abort'    # Abort on panic
incremental = false
codegen-units = 1  # Single codegen unit for better optimization

# Custom profile for production
[profile.production]
inherits = "release"
opt-level = 3
lto = "fat"        # Full LTO
codegen-units = 1
panic = "abort"
strip = "symbols"

# Profile for development with some optimizations
[profile.dev-optimized]
inherits = "dev"
opt-level = 1
debug = true
```

### Using Custom Profiles
```bash
# Build with custom profile
cargo build --profile production

# Run with custom profile  
cargo run --profile dev-optimized
```

## Build Scripts

### Build Script (build.rs)
```rust
// build.rs - runs before compilation
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // Re-run this build script if build.rs changes
    println!("cargo:rerun-if-changed=build.rs");
    
    // Re-run if source files change
    println!("cargo:rerun-if-changed=src/");
    
    // Set environment variable for compile time
    println!("cargo:rustc-env=BUILD_TIME={}", chrono::Utc::now().timestamp());
    
    // Add library search path
    println!("cargo:rustc-link-search=native=/usr/local/lib");
    
    // Link external library
    println!("cargo:rustc-link-lib=static=mylib");
    
    // Set configuration flag
    if cfg!(feature = "ssl") {
        println!("cargo:rustc-cfg=feature=\"ssl\"");
    }
    
    // Generate code
    generate_bindings();
}

fn generate_bindings() {
    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks))
        .generate()
        .expect("Unable to generate bindings");

    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}
```

## Cross-Platform Building

### Cross-Compilation Setup
```bash
# Install cross tool for easier cross-compilation
cargo install cross

# Build for different platforms using cross
cross build --target aarch64-unknown-linux-gnu
cross build --target x86_64-pc-windows-gnu
cross build --target x86_64-apple-darwin
```

### Platform-Specific Dependencies
```toml
[target.'cfg(windows)'.dependencies]
winapi = { version = "0.3", features = ["winuser"] }

[target.'cfg(unix)'.dependencies]
nix = "0.26"

[target.'cfg(target_os = "macos")'.dependencies]
core-foundation = "0.9"

[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "0.2"
```

### Build Matrix Script
```bash
#!/bin/bash
# build-matrix.sh
set -e

TARGETS=(
    "x86_64-unknown-linux-gnu"
    "x86_64-pc-windows-gnu" 
    "x86_64-apple-darwin"
    "aarch64-unknown-linux-gnu"
    "aarch64-apple-darwin"
)

PROJECT_NAME="my-app"
VERSION=$(cargo metadata --no-deps --format-version 1 | jq -r '.packages[0].version')

echo "Building $PROJECT_NAME v$VERSION for multiple targets..."

# Clean previous builds
cargo clean

# Create release directory
mkdir -p releases

for target in "${TARGETS[@]}"; do
    echo "Building for $target..."
    
    # Add target if not installed
    rustup target add $target 2>/dev/null || true
    
    # Build for target
    if command -v cross >/dev/null 2>&1; then
        cross build --release --target $target
    else
        cargo build --release --target $target
    fi
    
    # Package binary
    cd target/$target/release
    
    if [[ "$target" == *"windows"* ]]; then
        zip -9 "../../../releases/${PROJECT_NAME}-${VERSION}-${target}.zip" "${PROJECT_NAME}.exe"
    else
        tar -czf "../../../releases/${PROJECT_NAME}-${VERSION}-${target}.tar.gz" "$PROJECT_NAME"
    fi
    
    cd ../../..
    
    echo "✓ Built and packaged for $target"
done

echo "All builds complete! Check releases/ directory."
```

## Build Optimization

### Size Optimization
```toml
[profile.release]
opt-level = "z"     # Optimize for size
lto = true
codegen-units = 1
panic = "abort"
strip = true

# Additional size reduction
[profile.release.package."*"]
opt-level = "z"
```

### Build Speed Optimization
```toml
# For faster debug builds
[profile.dev]
opt-level = 1       # Some optimization
incremental = true
codegen-units = 512 # More parallel codegen units

# Use mold linker for faster linking (Linux)
[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=mold"]
```

### Memory Usage Optimization
```bash
# Set environment variables to limit memory usage
export CARGO_BUILD_JOBS=2
export RUSTC_WRAPPER=sccache  # Use sccache for caching

# Build with limited parallelism
cargo build --jobs 2
```

## Build Tools Integration

### Makefile Integration
```makefile
# Makefile
.PHONY: build build-release clean test

CARGO_FLAGS := --color always

build:
	cargo build $(CARGO_FLAGS)

build-release:
	cargo build --release $(CARGO_FLAGS)

build-all-targets:
	cargo build --all-targets $(CARGO_FLAGS)

clean:
	cargo clean

test:
	cargo test $(CARGO_FLAGS)

install:
	cargo install --path .

# Cross-compilation targets
build-linux:
	cross build --target x86_64-unknown-linux-gnu --release

build-windows:
	cross build --target x86_64-pc-windows-gnu --release

build-macos:
	cross build --target x86_64-apple-darwin --release

build-all: build-linux build-windows build-macos
```

### CI/CD Integration
```yaml
# .github/workflows/build.yml
name: Build

on: [push, pull_request]

jobs:
  build:
    name: Build
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        build: [linux, macos, windows]
        include:
          - build: linux
            os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
          - build: macos
            os: macos-latest
            target: x86_64-apple-darwin
          - build: windows
            os: windows-latest
            target: x86_64-pc-windows-msvc

    steps:
    - uses: actions/checkout@v3
    
    - name: Install Rust
      uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        target: ${{ matrix.target }}
        override: true
    
    - name: Build
      run: cargo build --release --target ${{ matrix.target }}
    
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: ${{ matrix.build }}-binary
        path: target/${{ matrix.target }}/release/
```

## Cargo Features and Workspace

### Feature Management
```toml
[features]
default = ["std"]
std = []
serde_support = ["serde", "serde_derive"]
async = ["tokio", "futures"]
tls = ["rustls", "webpki"]

[dependencies]
serde = { version = "1.0", optional = true }
serde_derive = { version = "1.0", optional = true }
tokio = { version = "1.0", optional = true }
futures = { version = "0.3", optional = true }
```

### Workspace Configuration
```toml
# Cargo.toml (workspace root)
[workspace]
members = [
    "app",
    "lib",
    "cli",
    "server"
]

# Shared dependencies
[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }

# Shared metadata
[workspace.metadata.release]
publish = false
pre-release-replacements = []
```

## Best Practices

- Use `cargo build --release` for production builds
- Enable LTO for maximum optimization in release builds
- Use cross-compilation for targeting multiple platforms
- Implement proper build scripts for complex projects
- Cache builds with sccache to speed up compilation
- Use workspaces for multi-crate projects
- Test builds on CI/CD for all target platforms
- Strip symbols in release builds to reduce size
- Use feature flags to make dependencies optional
- Profile build times with `cargo build --timings`