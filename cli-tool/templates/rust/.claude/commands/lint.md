# Rust Lint & Format

Run Rust linting and formatting tools for code quality and consistency.

## Purpose

This command helps you maintain high code quality through comprehensive linting with Clippy, formatting with rustfmt, and additional quality checks.

## Usage

```
/lint $ARGUMENTS
```

## What this command does

1. **Runs Clippy** for comprehensive linting and suggestions
2. **Formats code** with rustfmt for consistency
3. **Performs security audits** on dependencies
4. **Checks for unused dependencies** and code
5. **Validates documentation** and examples

## Example Commands

### Basic Linting
```bash
# Run Clippy on all targets
cargo clippy

# Run Clippy with all features
cargo clippy --all-features

# Run Clippy on specific package
cargo clippy --package my-lib

# Run Clippy with verbose output
cargo clippy --verbose
```

### Formatting
```bash
# Format all Rust files
cargo fmt

# Format specific file
rustfmt src/main.rs

# Check formatting without making changes
cargo fmt --check

# Format with specific edition
cargo fmt --edition 2021
```

### Advanced Linting
```bash
# Run Clippy with warnings as errors
cargo clippy -- -D warnings

# Run Clippy with specific lint levels
cargo clippy -- -W clippy::all -D clippy::correctness

# Run Clippy on all targets including tests
cargo clippy --all-targets

# Run Clippy on workspace
cargo clippy --workspace
```

## Clippy Configuration

### Clippy.toml Configuration
```toml
# clippy.toml
disallowed-methods = [
    "std::collections::HashMap::insert",
    "std::thread::sleep",
]

disallowed-types = [
    "std::collections::LinkedList",
]

cognitive-complexity-threshold = 25
type-complexity-threshold = 250
single-char-binding-names-threshold = 5
too-many-arguments-threshold = 8
```

### Lint Levels in Code
```rust
// Disable specific lint for entire crate
#![allow(clippy::too_many_arguments)]

// Enable specific lint for entire crate
#![warn(clippy::all)]
#![deny(clippy::correctness)]

// Disable lint for specific function
#[allow(clippy::result_unit_err)]
fn my_function() -> Result<(), ()> {
    Ok(())
}

// Disable lint for specific block
#[allow(clippy::unnecessary_unwrap)]
{
    let x = Some(1);
    if x.is_some() {
        println!("{}", x.unwrap());
    }
}
```

## Rustfmt Configuration

### rustfmt.toml Configuration
```toml
# rustfmt.toml
edition = "2021"
max_width = 100
hard_tabs = false
tab_spaces = 4
newline_style = "Unix"
indent_style = "Block"
wrap_comments = true
format_code_in_doc_comments = true
normalize_comments = true
normalize_doc_attributes = true
license_template_path = "LICENSE_TEMPLATE"
format_strings = true
format_macro_matchers = true
format_macro_bodies = true
hex_literal_case = "Preserve"
empty_item_single_line = true
struct_lit_single_line = true
fn_single_line = false
where_single_line = false
imports_indent = "Block"
imports_layout = "Mixed"
group_imports = "StdExternalCrate"
reorder_imports = true
reorder_modules = true
reorder_impl_items = false
```

### Format-Specific Settings
```rust
// Force rustfmt to keep formatting
#[rustfmt::skip]
fn unformatted() {
    let x    =    1;
    let y=2;
}

// Format specific attributes
#[rustfmt::skip::attributes(derive)]
#[derive(Debug,Clone,PartialEq)]
struct MyStruct;
```

## Additional Quality Tools

### Cargo Audit
```bash
# Install cargo-audit
cargo install cargo-audit

# Run security audit
cargo audit

# Audit with specific database
cargo audit --db /path/to/advisory-db

# Generate audit report
cargo audit --json > audit-report.json
```

### Cargo Deny
```bash
# Install cargo-deny
cargo install cargo-deny

# Initialize deny configuration
cargo deny init

# Check licenses
cargo deny check licenses

# Check for banned dependencies
cargo deny check bans

# Check for security advisories
cargo deny check advisories

# Check everything
cargo deny check
```

### Cargo Outdated
```bash
# Install cargo-outdated
cargo install cargo-outdated

# Check for outdated dependencies
cargo outdated

# Check root dependencies only
cargo outdated --root-deps-only

# Check with specific format
cargo outdated --format json
```

### Cargo Unused Dependencies
```bash
# Install cargo-udeps
cargo install cargo-udeps

# Check for unused dependencies
cargo +nightly udeps

# Check specific package
cargo +nightly udeps --package my-lib
```

## Lint Categories

### Clippy Lint Groups
```bash
# Run all clippy lints
cargo clippy -- -W clippy::all

# Run pedantic lints
cargo clippy -- -W clippy::pedantic

# Run nursery lints (experimental)
cargo clippy -- -W clippy::nursery

# Run cargo-specific lints
cargo clippy -- -W clippy::cargo

# Run restriction lints (very strict)
cargo clippy -- -W clippy::restriction
```

### Custom Lint Configuration
```rust
// lib.rs or main.rs
#![warn(
    clippy::all,
    clippy::pedantic,
    clippy::nursery,
    clippy::cargo,
    rust_2018_idioms,
    missing_debug_implementations,
    missing_docs,
    unreachable_pub,
    unused_qualifications,
)]

#![allow(
    clippy::module_name_repetitions,
    clippy::must_use_candidate,
    clippy::missing_errors_doc,
)]
```

## Pre-commit Hooks

### Git Hook Setup
```bash
#!/bin/sh
# .git/hooks/pre-commit

# Run rustfmt check
if ! cargo fmt -- --check; then
    echo "Please run 'cargo fmt' before committing."
    exit 1
fi

# Run clippy
if ! cargo clippy --all-targets --all-features -- -D warnings; then
    echo "Please fix clippy warnings before committing."
    exit 1
fi

# Run tests
if ! cargo test; then
    echo "Tests must pass before committing."
    exit 1
fi
```

### Using pre-commit Framework
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files

  - repo: https://github.com/doublify/pre-commit-rust
    rev: v1.0
    hooks:
      - id: fmt
      - id: clippy
        args: ['--all-targets', '--all-features', '--', '-D', 'warnings']
      - id: cargo-check
```

## IDE Integration

### VS Code Settings
```json
{
    "rust-analyzer.checkOnSave.command": "clippy",
    "rust-analyzer.checkOnSave.allTargets": true,
    "rust-analyzer.checkOnSave.allFeatures": true,
    "rust-analyzer.rustfmt.extraArgs": ["--config", "tab_spaces=4"],
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.rust-analyzer": true
    }
}
```

### Vim/Neovim Configuration
```lua
-- Using rust-tools.nvim
require('rust-tools').setup({
    tools = {
        runnables = {
            use_telescope = true,
        },
        inlay_hints = {
            auto = true,
            show_parameter_hints = true,
        },
    },
    server = {
        on_attach = function(client, bufnr)
            vim.keymap.set('n', '<Leader>rr', '<cmd>RustRunnables<cr>', { buffer = bufnr })
            vim.keymap.set('n', '<Leader>rc', '<cmd>RustOpenCargo<cr>', { buffer = bufnr })
        end,
        settings = {
            ["rust-analyzer"] = {
                checkOnSave = {
                    command = "clippy",
                    allTargets = true,
                    allFeatures = true,
                    extraArgs = { "--", "-D", "warnings" },
                },
            },
        },
    },
})
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Code Quality
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        components: rustfmt, clippy
        override: true
    
    - name: Check formatting
      run: cargo fmt --all -- --check
    
    - name: Run Clippy
      run: cargo clippy --all-targets --all-features -- -D warnings
    
    - name: Security audit
      run: |
        cargo install cargo-audit
        cargo audit
    
    - name: Check for unused dependencies
      run: |
        cargo install cargo-udeps
        cargo +nightly udeps
```

### GitLab CI Configuration
```yaml
stages:
  - lint
  - test

lint:
  stage: lint
  image: rust:latest
  script:
    - rustup component add rustfmt clippy
    - cargo fmt --all -- --check
    - cargo clippy --all-targets --all-features -- -D warnings
    - cargo install cargo-audit
    - cargo audit
```

## Performance Linting

### Clippy Performance Lints
```bash
# Focus on performance-related lints
cargo clippy -- -W clippy::perf

# Check for inefficient string operations
cargo clippy -- -W clippy::string_add -W clippy::string_add_assign

# Check for unnecessary clones
cargo clippy -- -W clippy::clone_on_ref_ptr

# Check for inefficient iterations
cargo clippy -- -W clippy::needless_collect
```

### Performance Analysis Tools
```bash
# Install cargo-bloat for binary size analysis
cargo install cargo-bloat

# Analyze binary size
cargo bloat --release

# Analyze crate dependencies
cargo bloat --release --crates

# Install cargo-expand for macro expansion
cargo install cargo-expand

# Expand macros to see generated code
cargo expand
```

## Documentation Linting

### Doc Comments and Examples
```rust
/// Calculate the factorial of a number
///
/// # Examples
///
/// ```
/// use my_crate::factorial;
/// assert_eq!(factorial(5), 120);
/// ```
///
/// # Panics
///
/// This function will panic if the input is negative:
///
/// ```should_panic
/// use my_crate::factorial;
/// factorial(-1);
/// ```
///
/// # Errors
///
/// Returns an error if the calculation would overflow:
///
/// ```
/// use my_crate::factorial_checked;
/// assert!(factorial_checked(1000).is_err());
/// ```
pub fn factorial(n: u32) -> u32 {
    if n == 0 { 1 } else { n * factorial(n - 1) }
}
```

### Documentation Testing
```bash
# Test documentation examples
cargo test --doc

# Test documentation with specific package
cargo test --doc --package my-lib

# Generate documentation
cargo doc --open

# Check documentation coverage
cargo install cargo-doc-coverage
cargo doc-coverage
```

## Custom Lints

### Writing Custom Clippy Lints
```rust
// my_lint.rs
use rustc_lint::{EarlyLintPass, LintContext, LintPass};
use rustc_session::{declare_lint, declare_lint_pass};

declare_lint! {
    pub MY_CUSTOM_LINT,
    Warn,
    "description of my custom lint"
}

declare_lint_pass!(MyCustomLint => [MY_CUSTOM_LINT]);

impl EarlyLintPass for MyCustomLint {
    fn check_expr(&mut self, cx: &rustc_lint::EarlyContext, expr: &rustc_ast::Expr) {
        // Implementation of custom lint logic
    }
}
```

## Best Practices

### Lint Configuration
- Use project-specific lint configuration files
- Enable appropriate lint levels for your project
- Document lint suppressions with reasons
- Regularly update lint tools and rules

### Code Formatting
- Use consistent formatting across the project
- Automate formatting in CI/CD pipelines
- Configure IDE integration for automatic formatting
- Use rustfmt configuration for project-specific styles

### Quality Maintenance
- Run security audits regularly
- Check for unused dependencies periodically
- Keep dependencies updated
- Use pre-commit hooks for consistent quality

### Team Collaboration
- Document coding standards and lint rules
- Provide clear error messages for lint failures
- Use consistent tooling across development environments
- Regular code reviews focusing on quality aspects