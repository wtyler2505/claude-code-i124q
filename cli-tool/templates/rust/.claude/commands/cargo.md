# Cargo Package Management

Manage Rust packages, dependencies, and workspace configuration with Cargo.

## Purpose

This command helps you effectively manage Rust projects using Cargo's comprehensive package management and build system.

## Usage

```
/cargo $ARGUMENTS
```

## What this command does

1. **Manages dependencies** and versions
2. **Handles workspace configuration** for multi-crate projects
3. **Publishes packages** to crates.io
4. **Provides project utilities** and maintenance tools

## Example Commands

### Project Management
```bash
# Create new binary project
cargo new my-project

# Create new library project
cargo new --lib my-lib

# Create new project in current directory
cargo init

# Create project with specific name
cargo init --name my-project

# Generate Cargo.lock
cargo generate-lockfile

# Update dependencies
cargo update

# Update specific dependency
cargo update -p serde
```

### Dependency Management
```bash
# Add dependency
cargo add serde

# Add development dependency
cargo add --dev tokio-test

# Add build dependency
cargo add --build cc

# Add dependency with features
cargo add serde --features derive

# Add dependency with version constraint
cargo add serde@1.0

# Add git dependency
cargo add serde --git https://github.com/serde-rs/serde

# Add local path dependency
cargo add my-lib --path ../my-lib

# Remove dependency
cargo rm serde
```

### Information and Search
```bash
# Search for crates
cargo search serde

# Show information about a crate
cargo show serde

# List dependencies
cargo tree

# Show outdated dependencies
cargo tree --duplicates

# Show dependency graph
cargo tree --depth 2

# Check dependency licenses
cargo tree --format "{p} {l}"
```

### Building and Running
```bash
# Build project
cargo build

# Build optimized (release mode)
cargo build --release

# Run binary
cargo run

# Run with arguments
cargo run -- --help

# Run specific binary
cargo run --bin my-app

# Run example
cargo run --example hello

# Check project (fast compile check)
cargo check

# Clean build artifacts
cargo clean
```

## Cargo.toml Configuration

### Basic Package Configuration
```toml
[package]
name = "my-project"
version = "0.1.0"
edition = "2021"
authors = ["Your Name <you@example.com>"]
license = "MIT OR Apache-2.0"
description = "A brief description of the project"
documentation = "https://docs.rs/my-project"
homepage = "https://github.com/username/my-project"
repository = "https://github.com/username/my-project"
readme = "README.md"
keywords = ["web", "async", "server"]
categories = ["web-programming"]
rust-version = "1.70"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }
clap = { version = "4.0", features = ["derive"] }

[dev-dependencies]
tokio-test = "0.4"
criterion = "0.5"
proptest = "1.0"

[build-dependencies]
cc = "1.0"

# Optional dependencies
[dependencies]
redis = { version = "0.23", optional = true }
postgres = { version = "0.19", optional = true }

[features]
default = ["redis"]
database = ["postgres"]
cache = ["redis"]
full = ["database", "cache"]
```

### Multiple Binaries
```toml
# Default binary (src/main.rs)
[[bin]]
name = "my-app"
path = "src/main.rs"

# Additional binaries
[[bin]]
name = "cli-tool"
path = "src/bin/cli.rs"

[[bin]]
name = "server"
path = "src/bin/server.rs"

# Examples
[[example]]
name = "basic"
path = "examples/basic.rs"

# Benchmarks
[[bench]]
name = "performance"
harness = false

# Integration tests
[[test]]
name = "integration"
path = "tests/integration_test.rs"
```

### Workspace Configuration
```toml
# Workspace root Cargo.toml
[workspace]
members = [
    "app",
    "lib",
    "cli",
    "server",
    "shared"
]

exclude = [
    "target",
    "old-projects/*"
]

# Workspace-wide dependencies
[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }
anyhow = "1.0"

# Workspace-wide package info
[workspace.package]
authors = ["Your Name <you@example.com>"]
license = "MIT OR Apache-2.0"
edition = "2021"
rust-version = "1.70"

# Workspace-wide lints
[workspace.lints.rust]
unsafe_code = "forbid"

[workspace.lints.clippy]
all = "warn"
pedantic = "warn"
```

### Member Crate Configuration
```toml
# Member crate Cargo.toml
[package]
name = "my-lib"
version.workspace = true
authors.workspace = true
license.workspace = true
edition.workspace = true

[dependencies]
# Use workspace dependencies
serde.workspace = true
tokio = { workspace = true, features = ["rt"] }

# Local dependencies
shared = { path = "../shared" }

[lints]
workspace = true
```

## Advanced Cargo Features

### Custom Commands
```bash
# Install cargo extensions
cargo install cargo-edit      # cargo add, cargo rm
cargo install cargo-watch     # cargo watch
cargo install cargo-expand    # cargo expand
cargo install cargo-flamegraph # cargo flamegraph
cargo install cargo-audit     # cargo audit
cargo install cargo-deny      # cargo deny
cargo install cargo-outdated  # cargo outdated

# Use custom commands
cargo watch -x check          # Watch and check on changes
cargo expand                  # Expand macros
cargo flamegraph             # Profile with flamegraph
```

### Publishing to crates.io
```bash
# Login to crates.io
cargo login

# Package for distribution
cargo package

# Publish to crates.io
cargo publish

# Publish dry run
cargo publish --dry-run

# Yank a published version
cargo yank --version 0.1.0

# Un-yank a version
cargo yank --version 0.1.0 --undo
```

### Version Management
```bash
# Set version
cargo set-version 1.0.0

# Bump version
cargo set-version --bump major
cargo set-version --bump minor
cargo set-version --bump patch

# Pre-release versions
cargo set-version 1.0.0-alpha.1
cargo set-version 1.0.0-beta.1
cargo set-version 1.0.0-rc.1
```

## Workspace Management

### Multi-Crate Project Structure
```
my-workspace/
├── Cargo.toml          # Workspace root
├── Cargo.lock          # Workspace lockfile
├── app/                # Main application
│   ├── Cargo.toml
│   └── src/
├── lib/                # Core library
│   ├── Cargo.toml
│   └── src/
├── cli/                # CLI tool
│   ├── Cargo.toml
│   └── src/
├── server/             # Web server
│   ├── Cargo.toml
│   └── src/
└── shared/             # Shared utilities
    ├── Cargo.toml
    └── src/
```

### Workspace Commands
```bash
# Build all workspace members
cargo build --workspace

# Test all workspace members
cargo test --workspace

# Build specific member
cargo build -p app

# Run binary from specific member
cargo run -p cli

# Add dependency to specific member
cargo add serde -p lib

# Check specific member
cargo check -p server
```

## Scripts and Automation

### Cargo.toml Scripts (using cargo-make)
```toml
# Install: cargo install cargo-make

[tasks.dev]
description = "Development build and run"
command = "cargo"
args = ["run"]
dependencies = ["build"]

[tasks.test-all]
description = "Run all tests"
command = "cargo"
args = ["test", "--workspace"]

[tasks.lint]
description = "Run linting"
script = [
    "cargo fmt --all -- --check",
    "cargo clippy --workspace -- -D warnings"
]

[tasks.release-build]
description = "Build optimized release"
command = "cargo"
args = ["build", "--release", "--workspace"]

[tasks.publish-all]
description = "Publish all crates"
script = [
    "cargo publish -p shared",
    "cargo publish -p lib", 
    "cargo publish -p cli",
    "cargo publish -p app"
]
```

### Custom Build Scripts
```bash
#!/bin/bash
# build-all.sh
set -e

echo "Building workspace..."

# Clean previous builds
cargo clean

# Build all members
cargo build --workspace --release

# Run tests
cargo test --workspace

# Create distribution
mkdir -p dist
cp target/release/app dist/
cp target/release/cli dist/
cp target/release/server dist/

echo "Build complete! Binaries in dist/"
```

## Configuration and Profiles

### Custom Profiles
```toml
# Custom profiles in Cargo.toml
[profile.dev-opt]
inherits = "dev"
opt-level = 1

[profile.release-debug]
inherits = "release"
debug = true

[profile.tiny]
inherits = "release"
opt-level = "z"
lto = true
codegen-units = 1
panic = "abort"
```

### Build Configuration
```toml
# Build configuration
[build]
target = "x86_64-unknown-linux-gnu"
target-dir = "target"
rustc = "rustc"
rustdoc = "rustdoc"
jobs = 4

[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=lld"]

[env]
DATABASE_URL = "postgres://localhost/mydb"
```

### Cargo Config (.cargo/config.toml)
```toml
# .cargo/config.toml
[alias]
b = "build"
t = "test"
r = "run"
c = "check"
fmt-check = "fmt -- --check"
clippy-strict = "clippy -- -D warnings -W clippy::pedantic"

[build]
rustc-wrapper = "sccache"  # Use sccache for caching

[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=mold"]

[registries.my-registry]
index = "https://my-intranet:8080/git/index"

[net]
retry = 2
git-fetch-with-cli = true
```

## Troubleshooting

### Common Issues and Solutions
```bash
# Clear cargo cache
cargo clean

# Update cargo itself
rustup update

# Fix corrupted lockfile
rm Cargo.lock
cargo generate-lockfile

# Check for dependency conflicts
cargo tree --duplicates

# Verify all dependencies
cargo verify-project

# Fix path dependencies
cargo metadata --format-version 1
```

### Dependency Resolution
```bash
# Force update specific dependency
cargo update -p serde --precise 1.0.136

# Use alternative registry
cargo install --registry my-registry my-crate

# Override dependency source
[patch.crates-io]
serde = { git = "https://github.com/serde-rs/serde" }
```

### Performance Optimization
```bash
# Use parallel compilation
export CARGO_BUILD_JOBS=8

# Use faster linker
export RUSTFLAGS="-C link-arg=-fuse-ld=lld"

# Enable incremental compilation
export CARGO_INCREMENTAL=1

# Use sccache for shared compilation cache
export RUSTC_WRAPPER=sccache
```

## Best Practices

- Use semantic versioning for your crates
- Keep dependencies up to date but test changes
- Use workspace for related crates
- Specify minimum supported Rust version (MSRV)
- Document all public APIs
- Use feature flags for optional functionality
- Test on multiple Rust versions in CI
- Use `cargo audit` for security checks
- Pin dependency versions in applications
- Use ranges for library dependencies
- Keep build times reasonable with selective features
- Use local path dependencies during development