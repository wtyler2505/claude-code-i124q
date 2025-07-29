# Rust Cross-Compilation

Cross-compile Rust applications for different platforms, architectures, and operating systems.

## Purpose

This command helps you build Rust applications for multiple target platforms from a single development environment.

## Usage

```
/cross $ARGUMENTS
```

## What this command does

1. **Sets up cross-compilation** for different targets
2. **Manages target toolchains** and dependencies
3. **Handles platform-specific code** and features
4. **Provides Docker-based compilation** environments
5. **Creates distribution packages** for multiple platforms

## Example Commands

### Basic Cross-Compilation Setup
```bash
# List available targets
rustup target list

# Add specific targets
rustup target add x86_64-unknown-linux-gnu
rustup target add x86_64-pc-windows-gnu
rustup target add x86_64-apple-darwin
rustup target add aarch64-unknown-linux-gnu

# Cross-compile for specific target
cargo build --target x86_64-unknown-linux-gnu

# Cross-compile with release optimizations
cargo build --release --target x86_64-pc-windows-gnu
```

### Using Cross Tool
```bash
# Install cross
cargo install cross

# Cross-compile using Docker containers
cross build --target x86_64-unknown-linux-gnu
cross build --target aarch64-unknown-linux-gnu
cross build --target armv7-unknown-linux-gnueabihf

# Build for multiple targets
cross build --target x86_64-unknown-linux-musl --release
cross build --target x86_64-pc-windows-gnu --release
cross build --target aarch64-apple-darwin --release
```

### Target Configuration
```toml
# Cargo.toml
[package]
name = "my-app"
version = "0.1.0"
edition = "2021"

# Platform-specific dependencies
[target.'cfg(windows)'.dependencies]
winapi = { version = "0.3", features = ["winuser", "wincon"] }

[target.'cfg(unix)'.dependencies]
libc = "0.2"

[target.'cfg(target_os = "macos")'.dependencies]
core-foundation = "0.9"

[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "0.2"
js-sys = "0.3"
```

### Conditional Compilation
```rust
// Platform-specific code
#[cfg(target_os = "windows")]
fn platform_specific_function() {
    use std::os::windows::ffi::OsStrExt;
    println!("Running on Windows");
    // Windows-specific implementation
}

#[cfg(target_os = "linux")]
fn platform_specific_function() {
    println!("Running on Linux");
    // Linux-specific implementation
}

#[cfg(target_os = "macos")]
fn platform_specific_function() {
    println!("Running on macOS");
    // macOS-specific implementation
}

#[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
fn platform_specific_function() {
    println!("Running on unknown platform");
    // Fallback implementation
}

// Architecture-specific code
#[cfg(target_arch = "x86_64")]
fn arch_specific_function() {
    println!("Running on x86_64");
}

#[cfg(target_arch = "aarch64")]
fn arch_specific_function() {
    println!("Running on ARM64");
}

// Feature-based conditional compilation
#[cfg(feature = "advanced")]
fn advanced_feature() {
    println!("Advanced features enabled");
}

#[cfg(not(feature = "advanced"))]
fn advanced_feature() {
    println!("Advanced features disabled");
}

fn main() {
    platform_specific_function();
    arch_specific_function();
    advanced_feature();
}
```

### Cross.toml Configuration
```toml
# Cross.toml
[build]
# Use custom Docker image for all targets
default-target = "x86_64-unknown-linux-gnu"

[target.x86_64-unknown-linux-gnu]
# Custom Docker image with additional dependencies
image = "my-registry/rust-cross:latest"

[target.aarch64-unknown-linux-gnu]
# Use pre-build hooks
pre-build = [
    "apt-get update",
    "apt-get install -y libssl-dev pkg-config",
]

[target.x86_64-pc-windows-gnu]
# Set environment variables
[target.x86_64-pc-windows-gnu.env]
passthrough = [
    "DEBIAN_FRONTEND",
    "TZ",
]
```

### Building for WebAssembly
```toml
# Cargo.toml for WASM
[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
js-sys = "0.3"
web-sys = "0.3"

[dependencies.web-sys]
version = "0.3"
features = [
    "console",
    "Document",
    "Element",
    "HtmlElement",
    "Window",
]
```

```rust
// src/lib.rs for WASM
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    log(&format!("Hello, {}!", name));
}

#[wasm_bindgen]
pub struct Calculator {
    value: f64,
}

#[wasm_bindgen]
impl Calculator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Calculator {
        Calculator { value: 0.0 }
    }
    
    #[wasm_bindgen]
    pub fn add(&mut self, value: f64) -> f64 {
        self.value += value;
        self.value
    }
    
    #[wasm_bindgen]
    pub fn get_value(&self) -> f64 {
        self.value
    }
}
```

```bash
# Build for WebAssembly
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release

# Using wasm-pack
cargo install wasm-pack
wasm-pack build --target web --out-dir pkg
```

### Docker-based Cross-Compilation
```dockerfile
# Dockerfile for cross-compilation
FROM rust:1.75

# Install cross-compilation toolchain
RUN rustup target add x86_64-unknown-linux-gnu \
    && rustup target add aarch64-unknown-linux-gnu \
    && rustup target add x86_64-pc-windows-gnu

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc-aarch64-linux-gnu \
    gcc-mingw-w64-x86-64 \
    pkg-config \
    libssl-dev

# Set up linking
ENV CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc
ENV CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER=x86_64-w64-mingw32-gcc

WORKDIR /app
COPY . .

# Build script
COPY build-all.sh .
RUN chmod +x build-all.sh
CMD ["./build-all.sh"]
```

```bash
#!/bin/bash
# build-all.sh
set -e

targets=(
    "x86_64-unknown-linux-gnu"
    "aarch64-unknown-linux-gnu" 
    "x86_64-pc-windows-gnu"
)

for target in "${targets[@]}"; do
    echo "Building for $target..."
    cargo build --release --target "$target"
    
    # Create target-specific directory
    mkdir -p "dist/$target"
    
    # Copy binary to dist
    if [[ "$target" == *"windows"* ]]; then
        cp "target/$target/release/my-app.exe" "dist/$target/"
    else
        cp "target/$target/release/my-app" "dist/$target/"
    fi
done

echo "Cross-compilation complete!"
```

### Static Linking and MUSL
```bash
# Add MUSL target for static linking
rustup target add x86_64-unknown-linux-musl

# Install musl-gcc
# On Ubuntu/Debian:
sudo apt-get install musl-tools

# On macOS:
brew install filosottile/musl-cross/musl-cross

# Build statically linked binary
cargo build --target x86_64-unknown-linux-musl --release

# Verify static linking
ldd target/x86_64-unknown-linux-musl/release/my-app
# Should show "not a dynamic executable"
```

### CI/CD Pipeline for Cross-Compilation
```yaml
# .github/workflows/cross-compile.yml
name: Cross Compile

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  cross-compile:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        target:
          - x86_64-unknown-linux-gnu
          - x86_64-unknown-linux-musl
          - aarch64-unknown-linux-gnu
          - x86_64-pc-windows-gnu
          - x86_64-apple-darwin
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Install Rust
      uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        target: ${{ matrix.target }}
        override: true
    
    - name: Install cross
      run: cargo install cross
    
    - name: Build
      run: cross build --release --target ${{ matrix.target }}
    
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: ${{ matrix.target }}
        path: |
          target/${{ matrix.target }}/release/my-app*
          !target/${{ matrix.target }}/release/*.d
```

### Windows-specific Cross-Compilation
```toml
# .cargo/config.toml
[target.x86_64-pc-windows-gnu]
linker = "x86_64-w64-mingw32-gcc"
ar = "x86_64-w64-mingw32-ar"

[target.i686-pc-windows-gnu]
linker = "i686-w64-mingw32-gcc"
ar = "i686-w64-mingw32-ar"
```

```rust
// Windows-specific functionality
#[cfg(target_os = "windows")]
mod windows {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use winapi::um::wincon::GetConsoleMode;
    use winapi::um::processenv::GetStdHandle;
    use winapi::um::winbase::STD_OUTPUT_HANDLE;
    
    pub fn enable_ansi_support() -> Result<(), Box<dyn std::error::Error>> {
        unsafe {
            let handle = GetStdHandle(STD_OUTPUT_HANDLE);
            let mut mode = 0;
            
            if GetConsoleMode(handle, &mut mode) == 0 {
                return Err("Failed to get console mode".into());
            }
            
            // Enable ANSI escape sequences
            mode |= 0x0004; // ENABLE_VIRTUAL_TERMINAL_PROCESSING
            
            if winapi::um::wincon::SetConsoleMode(handle, mode) == 0 {
                return Err("Failed to set console mode".into());
            }
        }
        Ok(())
    }
}

#[cfg(not(target_os = "windows"))]
mod windows {
    pub fn enable_ansi_support() -> Result<(), Box<dyn std::error::Error>> {
        // No-op on non-Windows platforms
        Ok(())
    }
}
```

### macOS Cross-Compilation
```bash
# Install osxcross (on Linux)
git clone https://github.com/tpoechtrager/osxcross
cd osxcross

# Download macOS SDK (requires Xcode)
# Place MacOSX*.sdk.tar.xz in tarballs/

./build.sh

# Add to PATH
export PATH="$PATH:$PWD/target/bin"

# Add Rust target
rustup target add x86_64-apple-darwin

# Configure Cargo
export CARGO_TARGET_X86_64_APPLE_DARWIN_LINKER=x86_64-apple-darwin20.4-clang
export CC_x86_64_apple_darwin=x86_64-apple-darwin20.4-clang
export CXX_x86_64_apple_darwin=x86_64-apple-darwin20.4-clang++

# Build
cargo build --target x86_64-apple-darwin
```

### ARM Cross-Compilation
```bash
# Install ARM toolchain
sudo apt-get install gcc-arm-linux-gnueabihf gcc-aarch64-linux-gnu

# Add targets
rustup target add armv7-unknown-linux-gnueabihf
rustup target add aarch64-unknown-linux-gnu

# Configure linkers in .cargo/config.toml
[target.armv7-unknown-linux-gnueabihf]
linker = "arm-linux-gnueabihf-gcc"

[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"

# Build
cargo build --target armv7-unknown-linux-gnueabihf --release
cargo build --target aarch64-unknown-linux-gnu --release
```

### Testing Cross-Compiled Binaries
```bash
# Using QEMU for testing
sudo apt-get install qemu-user-static

# Test ARM binary on x86_64
qemu-arm-static target/armv7-unknown-linux-gnueabihf/release/my-app

# Test AArch64 binary
qemu-aarch64-static target/aarch64-unknown-linux-gnu/release/my-app

# Test with binfmt_misc (allows direct execution)
sudo apt-get install binfmt-support
target/aarch64-unknown-linux-gnu/release/my-app
```

### Distribution and Packaging
```bash
#!/bin/bash
# package.sh - Create distribution packages

VERSION=$(cargo metadata --no-deps --format-version 1 | jq -r '.packages[0].version')
APP_NAME="my-app"

targets=(
    "x86_64-unknown-linux-gnu:linux-amd64"
    "aarch64-unknown-linux-gnu:linux-arm64" 
    "x86_64-pc-windows-gnu:windows-amd64"
    "x86_64-apple-darwin:darwin-amd64"
)

for target_info in "${targets[@]}"; do
    IFS=':' read -r rust_target dist_name <<< "$target_info"
    
    echo "Packaging for $rust_target as $dist_name..."
    
    # Create package directory
    pkg_dir="packages/${APP_NAME}-${VERSION}-${dist_name}"
    mkdir -p "$pkg_dir"
    
    # Copy binary
    if [[ "$rust_target" == *"windows"* ]]; then
        cp "target/$rust_target/release/${APP_NAME}.exe" "$pkg_dir/"
    else
        cp "target/$rust_target/release/${APP_NAME}" "$pkg_dir/"
    fi
    
    # Copy additional files
    cp README.md LICENSE "$pkg_dir/"
    
    # Create archive
    if [[ "$rust_target" == *"windows"* ]]; then
        (cd packages && zip -r "${APP_NAME}-${VERSION}-${dist_name}.zip" "${APP_NAME}-${VERSION}-${dist_name}")
    else
        tar -czf "packages/${APP_NAME}-${VERSION}-${dist_name}.tar.gz" -C packages "${APP_NAME}-${VERSION}-${dist_name}"
    fi
    
    # Cleanup
    rm -rf "$pkg_dir"
done

echo "Packaging complete!"
ls -la packages/
```

### Troubleshooting Cross-Compilation
```bash
# Debug linking issues
RUST_LOG=debug cargo build --target x86_64-unknown-linux-gnu

# Show detailed error information
cargo build --target aarch64-unknown-linux-gnu --verbose

# Check dependencies
cargo tree --target x86_64-pc-windows-gnu

# Verify target installation
rustup target list --installed

# Clean and rebuild
cargo clean
cargo build --target x86_64-unknown-linux-musl

# Check library dependencies
objdump -p target/x86_64-unknown-linux-gnu/release/my-app | grep NEEDED
```

## Best Practices

### Target Management
- Pin specific target versions in CI/CD
- Test cross-compiled binaries on actual target systems
- Use static linking for easier distribution
- Document platform-specific requirements

### Code Organization
- Use feature flags for optional dependencies
- Keep platform-specific code minimal
- Test conditional compilation on all targets
- Use cfg attributes for platform differences

### Dependencies
- Choose cross-platform compatible crates
- Avoid platform-specific dependencies when possible
- Use feature flags to enable platform-specific features
- Test dependency resolution for all targets

### Testing Strategy
- Set up CI/CD for all target platforms
- Use emulation for testing when possible
- Validate binaries on actual target hardware
- Test both debug and release builds

### Security Considerations
- Keep cross-compilation toolchains updated
- Verify binary signatures and checksums
- Use secure build environments
- Audit cross-compilation dependencies