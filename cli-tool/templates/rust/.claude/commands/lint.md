# Rust Linting and Formatting

Run Rust code quality tools including rustfmt, clippy, and additional linters for code quality and style enforcement.

## Purpose

This command helps you maintain high-quality Rust code using the ecosystem's comprehensive linting and formatting tools.

## Usage

```
/lint $ARGUMENTS
```

## What this command does

1. **Formats code** with rustfmt for consistent style
2. **Runs clippy** for comprehensive linting and suggestions
3. **Performs additional checks** with cargo audit and other tools
4. **Provides actionable feedback** for code improvements

## Example Commands

### Code Formatting with rustfmt
```bash
# Format all Rust files in the project
cargo fmt

# Check if code is formatted (doesn't modify files)
cargo fmt -- --check

# Format specific file
rustfmt src/main.rs

# Format with custom configuration
cargo fmt -- --config-path rustfmt.toml

# Show what would be changed without applying
cargo fmt -- --print-changes
```

### Linting with Clippy
```bash
# Run clippy on the project
cargo clippy

# Run clippy with all features enabled
cargo clippy --all-features

# Run clippy on all targets (including tests, benches)
cargo clippy --all-targets

# Treat warnings as errors
cargo clippy -- -D warnings

# Run specific clippy lints
cargo clippy -- -W clippy::pedantic

# Allow specific lints
cargo clippy -- -A clippy::module_name_repetitions
```

### Advanced Clippy Usage
```bash
# Run clippy with custom configuration
cargo clippy -- -W clippy::all -W clippy::pedantic -W clippy::nursery

# Fix clippy suggestions automatically (when possible)
cargo clippy --fix

# Run clippy in different modes
cargo clippy -- -W clippy::cargo
cargo clippy -- -W clippy::complexity
cargo clippy -- -W clippy::correctness
cargo clippy -- -W clippy::perf
cargo clippy -- -W clippy::style
cargo clippy -- -W clippy::suspicious
```

## Configuration Files

### rustfmt Configuration (rustfmt.toml)
```toml
# rustfmt.toml
edition = "2021"
max_width = 100
hard_tabs = false
tab_spaces = 4
newline_style = "Unix"
use_small_heuristics = "Default"

# Import formatting
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
reorder_imports = true

# Function formatting
fn_args_layout = "Tall"
brace_style = "SameLineWhere"
control_brace_style = "AlwaysSameLine"

# Comment formatting
normalize_comments = true
wrap_comments = true
format_code_in_doc_comments = true

# String formatting
format_strings = false
format_macro_matchers = true

# Trailing comma
trailing_comma = "Vertical"
match_block_trailing_comma = false

# Spacing
spaces_around_ranges = false
type_punctuation_density = "Wide"

# Misc
remove_nested_parens = true
combine_control_expr = true
struct_field_align_threshold = 0
enum_discrim_align_threshold = 0
match_arm_blocks = true
force_multiline_blocks = false
fn_single_line = false
where_single_line = false
```

### Clippy Configuration (clippy.toml)
```toml
# clippy.toml
# Set the maximum cognitive complexity threshold
cognitive-complexity-threshold = 25

# Set the maximum number of lines for a function
too-many-lines-threshold = 150

# Set the maximum number of arguments for a function
too-many-arguments-threshold = 8

# Set the maximum number of struct fields
too-many-fields-threshold = 10

# Set the maximum nesting level
excessive-nesting-threshold = 5

# Avoid false positives for certain patterns
avoid-breaking-exported-api = true

# Configure specific lints
disallowed-names = ["foo", "bar", "baz"]
disallowed-types = ["std::collections::HashMap"]
```

### Cargo.toml Lint Configuration
```toml
[lints.rust]
unsafe_code = "forbid"
missing_docs = "warn"
unreachable_pub = "warn"

[lints.clippy]
all = "warn"
pedantic = "warn"
nursery = "warn"
cargo = "warn"

# Allow specific clippy lints
module_name_repetitions = "allow"
missing_errors_doc = "allow"
missing_panics_doc = "allow"
```

## Common Clippy Lints and Fixes

### Performance Lints
```rust
// ❌ Inefficient string concatenation
let mut result = String::new();
for item in items {
    result = result + &item; // Clippy: suspicious_op_assign_impl
}

// ✅ Use String::push_str or format!
let mut result = String::new();
for item in items {
    result.push_str(&item);
}

// ❌ Unnecessary collect
let processed: Vec<_> = items.iter()
    .map(|x| x * 2)
    .collect(); // Then immediately iterate again

// ✅ Chain iterators
let sum: i32 = items.iter()
    .map(|x| x * 2)
    .sum();
```

### Correctness Lints
```rust
// ❌ Potential integer overflow
fn add_one(x: u8) -> u8 {
    x + 1 // Clippy: integer_arithmetic
}

// ✅ Use checked arithmetic
fn add_one(x: u8) -> Option<u8> {
    x.checked_add(1)
}

// ❌ Comparison with NaN
if f64_val == f64::NAN { // Clippy: eq_op
    // This will never be true
}

// ✅ Use is_nan()
if f64_val.is_nan() {
    // Correct way to check for NaN
}
```

### Style Lints
```rust
// ❌ Redundant field names
let user = User {
    name: name, // Clippy: redundant_field_names
    age: age,
};

// ✅ Use shorthand
let user = User { name, age };

// ❌ Unnecessary unwrap
let value = option.unwrap(); // Clippy: unwrap_used

// ✅ Handle the Option properly
let value = match option {
    Some(v) => v,
    None => return Err("No value found"),
};
```

### Complexity Lints
```rust
// ❌ Too complex match
match value {
    1 | 2 | 3 | 4 | 5 => "small", // Clippy: match_like_matches_macro
    6 | 7 | 8 | 9 | 10 => "medium",
    _ => "large",
}

// ✅ Use matches! macro or if-else
if matches!(value, 1..=5) {
    "small"
} else if matches!(value, 6..=10) {
    "medium"
} else {
    "large"
}
```

## Advanced Linting Tools

### cargo-audit (Security)
```bash
# Install cargo-audit
cargo install cargo-audit

# Run security audit
cargo audit

# Generate report in different formats
cargo audit --json
cargo audit --json | jq

# Fix vulnerabilities automatically (when possible)
cargo audit fix
```

### cargo-deny (Dependency Management)
```bash
# Install cargo-deny
cargo install cargo-deny

# Initialize configuration
cargo deny init

# Check licenses
cargo deny check licenses

# Check for banned dependencies
cargo deny check bans

# Check for security advisories
cargo deny check advisories

# Check for duplicate dependencies
cargo deny check sources
```

#### deny.toml Configuration
```toml
[licenses]
allow = ["MIT", "Apache-2.0", "BSD-3-Clause"]
deny = ["GPL-3.0"]

[bans]
multiple-versions = "warn"
deny = [
    { name = "structopt", reason = "Use clap v4 instead" },
]

[advisories]
vulnerability = "deny"
unmaintained = "warn"
notice = "warn"
```

### cargo-machete (Unused Dependencies)
```bash
# Install cargo-machete
cargo install cargo-machete

# Find unused dependencies
cargo machete

# Fix unused dependencies (remove from Cargo.toml)
cargo machete --fix
```

### cargo-outdated (Dependency Updates)
```bash
# Install cargo-outdated
cargo install cargo-outdated

# Check for outdated dependencies
cargo outdated

# Show only root dependencies
cargo outdated --root-deps-only

# Exit with error if outdated dependencies found
cargo outdated --exit-code 1
```

## Comprehensive Linting Script

### lint.sh
```bash
#!/bin/bash
set -e

echo "🦀 Running comprehensive Rust linting..."

# 1. Format code
echo "→ Formatting code with rustfmt..."
cargo fmt --all

# 2. Basic clippy
echo "→ Running clippy..."
cargo clippy --all-targets --all-features -- -D warnings

# 3. Advanced clippy checks
echo "→ Running pedantic clippy checks..."
cargo clippy --all-targets --all-features -- \
    -W clippy::pedantic \
    -W clippy::nursery \
    -W clippy::cargo \
    -A clippy::module_name_repetitions \
    -A clippy::missing_errors_doc

# 4. Security audit
echo "→ Running security audit..."
if command -v cargo-audit >/dev/null 2>&1; then
    cargo audit
else
    echo "  cargo-audit not found. Install with: cargo install cargo-audit"
fi

# 5. Check for unused dependencies
echo "→ Checking for unused dependencies..."
if command -v cargo-machete >/dev/null 2>&1; then
    cargo machete
else
    echo "  cargo-machete not found. Install with: cargo install cargo-machete"
fi

# 6. License and ban checks
echo "→ Running cargo-deny checks..."  
if command -v cargo-deny >/dev/null 2>&1; then
    cargo deny check
else
    echo "  cargo-deny not found. Install with: cargo install cargo-deny"
fi

# 7. Check for outdated dependencies
echo "→ Checking for outdated dependencies..."
if command -v cargo-outdated >/dev/null 2>&1; then
    cargo outdated --root-deps-only
else
    echo "  cargo-outdated not found. Install with: cargo install cargo-outdated"
fi

echo "✅ Linting complete!"
```

## IDE Integration

### VS Code Configuration
```json
{
    "rust-analyzer.check.command": "clippy",
    "rust-analyzer.check.allTargets": true,
    "rust-analyzer.check.extraArgs": [
        "--", "-W", "clippy::pedantic", "-W", "clippy::nursery"
    ],
    "rust-analyzer.rustfmt.extraArgs": [
        "+nightly"
    ],
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll": true
    }
}
```

### Vim/Neovim Configuration
```lua
-- Using nvim-lspconfig and rust-tools.nvim
require('rust-tools').setup({
    tools = {
        autoSetHints = true,
        runnables = {
            use_telescope = true,
        },
    },
    server = {
        settings = {
            ["rust-analyzer"] = {
                check = {
                    command = "clippy",
                    extraArgs = { "--", "-W", "clippy::pedantic" },
                },
                rustfmt = {
                    extraArgs = { "+nightly" },
                },
            },
        },
    },
})
```

## Pre-commit Hooks

### .pre-commit-config.yaml
```yaml
repos:
  - repo: local
    hooks:
      - id: rust-fmt
        name: rust-fmt
        entry: cargo fmt --all --
        language: system
        types: [rust]
        
      - id: rust-clippy
        name: rust-clippy
        entry: cargo clippy --all-targets --all-features -- -D warnings
        language: system
        types: [rust]
        pass_filenames: false
        
      - id: rust-audit
        name: rust-audit
        entry: cargo audit
        language: system
        types: [rust]
        pass_filenames: false
```

### Git Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running pre-commit Rust checks..."

# Format code
echo "Formatting code..."
cargo fmt --all

# Add formatted files
git add $(git diff --cached --name-only --diff-filter=ACM | grep '\.rs$')

# Run clippy
echo "Running clippy..."
cargo clippy --all-targets --all-features -- -D warnings

if [ $? -ne 0 ]; then
    echo "Clippy failed. Please fix the issues before committing."
    exit 1
fi

echo "Pre-commit checks passed!"
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Lint

on: [push, pull_request]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Install Rust
      uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        override: true
        components: rustfmt, clippy
    
    - name: Check formatting
      run: cargo fmt --all -- --check
    
    - name: Run clippy
      run: |
        cargo clippy --all-targets --all-features -- \
          -D warnings \
          -W clippy::pedantic \
          -W clippy::nursery \
          -A clippy::module_name_repetitions
    
    - name: Install and run cargo-audit
      run: |
        cargo install cargo-audit
        cargo audit
    
    - name: Install and run cargo-deny
      run: |
        cargo install cargo-deny
        cargo deny check
```

## Best Practices

- Run `cargo fmt` before committing code
- Use clippy with strictness appropriate for your project
- Set up pre-commit hooks to catch issues early
- Configure your IDE for automatic formatting and linting
- Use `cargo fix` to automatically apply suggestions
- Regularly update your linting tools
- Customize clippy rules for your project's needs
- Run security audits regularly with cargo-audit
- Check for unused dependencies periodically
- Document any intentional lint suppressions
- Use workspace-level lint configuration for consistency
- Integrate linting into your CI/CD pipeline