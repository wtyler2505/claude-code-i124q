# Cargo Package Manager

Comprehensive Cargo package management, dependency handling, and project lifecycle management.

## Purpose

This command helps you manage Rust projects with Cargo, including dependency management, publishing, and project configuration.

## Usage

```
/cargo $ARGUMENTS
```

## What this command does

1. **Manages dependencies** with version constraints and features
2. **Handles project creation** and configuration
3. **Manages publishing** to crates.io and private registries
4. **Provides workspace management** for multi-crate projects
5. **Handles build configurations** and profiles

## Example Commands

### Project Management
```bash
# Create new binary project
cargo new my-app

# Create new library project
cargo new my-lib --lib

# Create project with specific edition
cargo new my-app --edition 2021

# Create project with VCS
cargo new my-app --vcs git

# Initialize project in existing directory
cargo init

# Initialize library in existing directory
cargo init --lib
```

### Dependency Management
```bash
# Add dependency
cargo add serde

# Add dependency with specific version
cargo add serde@1.0.150

# Add dependency with features
cargo add serde --features derive

# Add development dependency
cargo add --dev tokio-test

# Add build dependency
cargo add --build cc

# Add optional dependency
cargo add --optional redis
```

### Dependency Information
```bash
# Show dependency tree
cargo tree

# Show specific dependency
cargo tree --package serde

# Show dependencies in specific format
cargo tree --format "{p} {f}"

# Show reverse dependencies
cargo tree --invert tokio

# Check for outdated dependencies
cargo outdated

# Show license information
cargo license
```

## Cargo.toml Configuration

### Basic Project Configuration
```toml
[package]
name = "my-app"
version = "0.1.0"
edition = "2021"
authors = ["Your Name <your.email@example.com>"]
license = "MIT OR Apache-2.0"
description = "A fantastic Rust application"
homepage = "https://github.com/username/my-app"
repository = "https://github.com/username/my-app"
documentation = "https://docs.rs/my-app"
readme = "README.md"
keywords = ["cli", "tool", "rust"]
categories = ["command-line-utilities"]
include = [
    "src/**/*",
    "Cargo.toml",
    "README.md",
    "LICENSE*"
]
exclude = [
    "tests/*",
    "examples/*",
    "benches/*"
]
```

### Dependency Specifications
```toml
[dependencies]
# Basic dependency
serde = "1.0"

# Dependency with features
serde = { version = "1.0", features = ["derive"] }

# Optional dependency
redis = { version = "0.21", optional = true }

# Git dependency
my-lib = { git = "https://github.com/username/my-lib" }

# Git dependency with specific branch/tag
my-lib = { git = "https://github.com/username/my-lib", branch = "main" }
my-lib = { git = "https://github.com/username/my-lib", tag = "v1.0.0" }

# Path dependency
my-local-lib = { path = "../my-local-lib" }

# Platform-specific dependencies
[target.'cfg(windows)'.dependencies]
winapi = "0.3"

[target.'cfg(unix)'.dependencies]
libc = "0.2"

[dev-dependencies]
tokio-test = "0.4"
proptest = "1.0"
criterion = "0.5"

[build-dependencies]
cc = "1.0"
```

### Feature Configuration
```toml
[features]
default = ["std"]
std = []
async = ["tokio", "futures"]
redis-backend = ["redis"]
full = ["async", "redis-backend"]

# Feature with dependencies
database = ["sqlx", "uuid"]
```

### Build Configuration
```toml
[profile.dev]
opt-level = 0
debug = true
overflow-checks = true

[profile.release]
opt-level = 3
debug = false
lto = true
codegen-units = 1
panic = "abort"
strip = true

[profile.test]
opt-level = 1
debug = true

[profile.bench]
opt-level = 3
debug = true
```

## Workspace Management

### Workspace Configuration
```toml
# Workspace Cargo.toml
[workspace]
members = [
    "my-lib",
    "my-app",
    "my-tools/*"
]

exclude = [
    "old-project"
]

resolver = "2"

[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }

[workspace.metadata.docs.rs]
all-features = true
```

### Workspace Commands
```bash
# Build all workspace members
cargo build --workspace

# Test all workspace members
cargo test --workspace

# Run specific workspace member
cargo run --bin my-app

# Check all workspace members
cargo check --workspace

# Clean all workspace members
cargo clean --workspace
```

## Publishing

### Preparing for Publishing
```bash
# Check package before publishing
cargo check

# Run tests
cargo test

# Check documentation
cargo doc

# Package the crate
cargo package

# List package contents
cargo package --list

# Verify package
cargo package --verify
```

### Publishing to crates.io
```bash
# Login to crates.io
cargo login

# Publish to crates.io
cargo publish

# Publish with specific registry
cargo publish --registry my-registry

# Dry run publish
cargo publish --dry-run
```

### Registry Configuration
```toml
# .cargo/config.toml
[registries]
my-registry = { index = "https://my-registry.com/index" }

[registry]
default = "my-registry"
```

## Advanced Features

### Custom Commands
```bash
# Install custom commands
cargo install cargo-expand
cargo install cargo-edit
cargo install cargo-outdated
cargo install cargo-audit

# Use custom commands
cargo expand
cargo edit
cargo outdated
cargo audit
```

### Cargo Scripts
```toml
# Cargo.toml
[package.metadata.scripts]
test-all = "cargo test && cargo test --doc"
lint = "cargo clippy -- -D warnings"
fmt-check = "cargo fmt --all -- --check"
```

### Build Scripts
```rust
// build.rs
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // Get output directory
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("hello.rs");
    
    // Generate code
    fs::write(
        &dest_path,
        "pub fn message() -> &'static str { \"Hello, World!\" }"
    ).unwrap();
    
    // Tell Cargo to rerun if build.rs changes
    println!("cargo:rerun-if-changed=build.rs");
    
    // Tell Cargo to rerun if src/template.rs changes
    println!("cargo:rerun-if-changed=src/template.rs");
    
    // Link to system library
    println!("cargo:rustc-link-lib=ssl");
    
    // Set environment variable
    println!("cargo:rustc-env=BUILT_TIME={}", chrono::Utc::now().format("%Y-%m-%d %H:%M:%S"));
}
```

## Configuration Files

### Global Configuration
```toml
# ~/.cargo/config.toml
[build]
target = "x86_64-unknown-linux-gnu"
rustflags = ["-C", "target-cpu=native"]

[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=lld"]

[registry]
index = "https://github.com/rust-lang/crates.io-index"

[net]
retry = 2
git-fetch-with-cli = true

[profile.release]
lto = true
codegen-units = 1
```

### Local Configuration
```toml
# .cargo/config.toml (project-specific)
[alias]
b = "build"
c = "check"
r = "run"
t = "test"

[env]
RUST_LOG = "debug"
DATABASE_URL = "postgres://localhost/mydb"
```

## Cargo Extensions

### Useful Cargo Extensions
```bash
# Code quality
cargo install cargo-clippy
cargo install cargo-fmt

# Documentation
cargo install cargo-doc

# Testing
cargo install cargo-tarpaulin  # Coverage
cargo install cargo-nextest    # Better test runner

# Performance
cargo install cargo-flamegraph
cargo install cargo-profiler

# Security
cargo install cargo-audit
cargo install cargo-deny

# Dependency management
cargo install cargo-edit
cargo install cargo-outdated
cargo install cargo-tree
cargo install cargo-license

# Build tools
cargo install cargo-watch
cargo install cargo-expand
cargo install cargo-bloat
```

### Using Extensions
```bash
# Watch for changes and rebuild
cargo watch -x run

# Expand macros
cargo expand

# Check for security vulnerabilities
cargo audit

# Analyze binary size
cargo bloat --release

# Generate flamegraph
cargo flamegraph --bin my-app

# Better test runner
cargo nextest run

# Generate license report
cargo license
```

## Troubleshooting

### Common Issues
```bash
# Clear cargo cache
cargo clean

# Update cargo index
cargo update

# Fix dependency issues
cargo update -p problematic-crate

# Check for conflicting dependencies
cargo tree --duplicates

# Verify package integrity
cargo verify-project

# Show cargo version
cargo --version
```

### Debug Information
```bash
# Verbose output
cargo build --verbose

# Show cargo configuration
cargo config list

# Show build timings
cargo build --timings

# Show dependency resolution
cargo tree --verbose
```

## CI/CD Integration

### GitHub Actions
```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        override: true
    
    - name: Cache dependencies
      uses: actions/cache@v3
      with:
        path: |
          ~/.cargo/registry
          ~/.cargo/git
          target
        key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
    
    - name: Build
      run: cargo build --verbose
    
    - name: Test
      run: cargo test --verbose
    
    - name: Clippy
      run: cargo clippy -- -D warnings
    
    - name: Format check
      run: cargo fmt --all -- --check
```

### GitLab CI
```yaml
stages:
  - build
  - test
  - publish

variables:
  CARGO_HOME: $CI_PROJECT_DIR/.cargo

cache:
  paths:
    - target/
    - .cargo/

build:
  stage: build
  script:
    - cargo build --release
  artifacts:
    paths:
      - target/release/my-app

test:
  stage: test
  script:
    - cargo test --verbose
    - cargo clippy -- -D warnings
    - cargo fmt --all -- --check

publish:
  stage: publish
  script:
    - cargo publish --dry-run
    - cargo publish
  only:
    - tags
```

## Best Practices

### Project Structure
- Use semantic versioning for releases
- Maintain comprehensive documentation
- Include examples and integration tests
- Use feature flags for optional functionality

### Dependency Management
- Pin dependency versions in applications
- Use version ranges in libraries
- Regularly update dependencies
- Audit dependencies for security issues

### Performance
- Use release builds for production
- Enable LTO for final binaries
- Monitor binary size with cargo-bloat
- Profile critical code paths

### Publishing
- Test thoroughly before publishing
- Use cargo package to verify contents
- Maintain changelog and documentation
- Follow Rust API guidelines

### Development Workflow
- Use cargo-watch for development
- Set up proper CI/CD pipelines
- Use pre-commit hooks for quality
- Maintain consistent coding standards