# Rust Test Runner

Run Rust tests with comprehensive coverage reporting, benchmarking, and advanced testing strategies.

## Purpose

This command helps you run Rust tests effectively with proper configuration, coverage analysis, doctests, and integration testing.

## Usage

```
/test $ARGUMENTS
```

## What this command does

1. **Runs unit tests** with comprehensive output
2. **Executes integration tests** and doctests
3. **Generates coverage reports** with detailed analysis
4. **Runs benchmarks** for performance validation
5. **Provides property-based testing** capabilities

## Example Commands

### Basic Testing
```bash
# Run all tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Run tests with verbose output
cargo test --verbose

# Run specific test
cargo test test_user_creation

# Run tests matching pattern
cargo test user_

# Run tests in specific module
cargo test tests::user_module
```

### Test Categories
```bash
# Run only unit tests
cargo test --lib

# Run only integration tests
cargo test --test integration

# Run only doctests
cargo test --doc

# Run only binary tests
cargo test --bin my-app

# Run tests for specific package
cargo test --package my-lib
```

### Advanced Testing Options
```bash
# Run tests with threads
cargo test -- --test-threads=4

# Run tests sequentially
cargo test -- --test-threads=1

# Run ignored tests
cargo test -- --ignored

# Run tests with timeout
timeout 30s cargo test

# Run tests with environment variables
RUST_TEST_THREADS=1 cargo test
```

## Test Coverage

### Using cargo-tarpaulin
```bash
# Install tarpaulin
cargo install cargo-tarpaulin

# Generate coverage report
cargo tarpaulin --out html

# Generate coverage with specific format
cargo tarpaulin --out xml --output-dir coverage/

# Coverage for specific packages
cargo tarpaulin --packages my-lib,my-app

# Coverage excluding certain files
cargo tarpaulin --exclude-files "tests/*" "examples/*"
```

### Using cargo-llvm-cov
```bash
# Install llvm-cov
cargo install cargo-llvm-cov

# Generate coverage report
cargo llvm-cov

# Generate HTML coverage report
cargo llvm-cov --html --output-dir coverage/

# Generate coverage for all targets
cargo llvm-cov --all-targets --lcov --output-path coverage.lcov
```

## Writing Effective Tests

### Unit Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_user_creation() {
        let user = User::new("John", "john@example.com");
        assert_eq!(user.name, "John");
        assert_eq!(user.email, "john@example.com");
    }

    #[test]
    fn test_user_validation() {
        let user = User::new("", "invalid-email");
        assert!(user.validate().is_err());
    }

    #[test]
    #[should_panic(expected = "Invalid email")]
    fn test_user_panic() {
        User::new("John", "").validate().unwrap();
    }

    #[test]
    #[ignore]
    fn expensive_test() {
        // Test that takes a long time
        thread::sleep(Duration::from_secs(5));
    }
}
```

### Property-Based Testing
```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn test_string_reverse_twice_is_identity(s in ".*") {
        let reversed_twice: String = s.chars().rev()
            .collect::<String>()
            .chars().rev()
            .collect();
        prop_assert_eq!(s, reversed_twice);
    }

    #[test]
    fn test_addition_commutative(a in 0..1000i32, b in 0..1000i32) {
        prop_assert_eq!(a + b, b + a);
    }

    #[test]
    fn test_vec_push_pop(
        mut vec in prop::collection::vec(any::<i32>(), 0..100),
        value in any::<i32>()
    ) {
        vec.push(value);
        prop_assert_eq!(vec.pop(), Some(value));
    }
}
```

### Async Testing
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tokio::test;

    #[tokio::test]
    async fn test_async_function() {
        let result = async_function().await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_timeout() {
        let result = tokio::time::timeout(
            Duration::from_secs(1),
            slow_async_function()
        ).await;
        
        assert!(result.is_err()); // Should timeout
    }

    #[tokio::test]
    async fn test_concurrent_operations() {
        let (tx, rx) = tokio::sync::oneshot::channel();
        
        let handle = tokio::spawn(async move {
            tx.send("Hello").unwrap();
        });
        
        let result = rx.await.unwrap();
        assert_eq!(result, "Hello");
        handle.await.unwrap();
    }
}
```

### Integration Tests
```rust
// tests/integration_test.rs
use my_app::*;
use std::process::Command;

#[test]
fn test_cli_interface() {
    let output = Command::new("./target/debug/my-app")
        .arg("--help")
        .output()
        .expect("Failed to execute command");

    assert!(output.status.success());
    assert!(String::from_utf8_lossy(&output.stdout).contains("Usage:"));
}

#[test]
fn test_api_integration() {
    let server = start_test_server();
    let client = reqwest::blocking::Client::new();
    
    let response = client
        .get(&format!("http://localhost:{}/health", server.port()))
        .send()
        .unwrap();
    
    assert_eq!(response.status(), 200);
    server.stop();
}
```

### Mock Testing
```rust
use mockall::*;

#[automock]
trait UserRepository {
    fn get_user(&self, id: u32) -> Result<User, Error>;
    fn save_user(&self, user: &User) -> Result<(), Error>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_service_with_mock() {
        let mut mock_repo = MockUserRepository::new();
        mock_repo
            .expect_get_user()
            .with(eq(1))
            .times(1)
            .returning(|_| Ok(User::new("John", "john@example.com")));

        let service = UserService::new(Box::new(mock_repo));
        let user = service.get_user(1).unwrap();
        
        assert_eq!(user.name, "John");
    }
}
```

## Test Organization

### Test Structure
```
src/
├── lib.rs
├── user.rs
└── user/
    └── tests.rs

tests/
├── integration/
│   ├── api_tests.rs
│   └── cli_tests.rs
├── common/
│   └── mod.rs
└── integration_test.rs
```

### Test Utilities
```rust
// tests/common/mod.rs
pub fn setup_test_db() -> TestDatabase {
    TestDatabase::new()
}

pub fn create_test_user() -> User {
    User::new("Test User", "test@example.com")
}

pub fn assert_user_valid(user: &User) {
    assert!(!user.name.is_empty());
    assert!(user.email.contains('@'));
}
```

## Benchmarking

### Criterion Benchmarks
```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn fibonacci_recursive(n: u64) -> u64 {
    match n {
        0 => 1,
        1 => 1,
        n => fibonacci_recursive(n-1) + fibonacci_recursive(n-2),
    }
}

fn fibonacci_iterative(n: u64) -> u64 {
    let mut a = 0;
    let mut b = 1;
    for _ in 0..n {
        let temp = a;
        a = b;
        b = temp + b;
    }
    b
}

fn criterion_benchmark(c: &mut Criterion) {
    c.bench_function("fib recursive 20", |b| {
        b.iter(|| fibonacci_recursive(black_box(20)))
    });
    
    c.bench_function("fib iterative 20", |b| {
        b.iter(|| fibonacci_iterative(black_box(20)))
    });
    
    let mut group = c.benchmark_group("fibonacci");
    for i in [10, 20, 30].iter() {
        group.bench_with_input(BenchmarkId::new("recursive", i), i, |b, i| {
            b.iter(|| fibonacci_recursive(black_box(*i)))
        });
        group.bench_with_input(BenchmarkId::new("iterative", i), i, |b, i| {
            b.iter(|| fibonacci_iterative(black_box(*i)))
        });
    }
    group.finish();
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
```

### Running Benchmarks
```bash
# Run benchmarks
cargo bench

# Run specific benchmark
cargo bench fibonacci

# Run benchmarks with baseline
cargo bench -- --save-baseline my-baseline

# Compare with baseline
cargo bench -- --baseline my-baseline
```

## Test Configuration

### Cargo.toml Test Configuration
```toml
[dev-dependencies]
tokio-test = "0.4"
proptest = "1.0"
mockall = "0.11"
criterion = "0.5"
tarpaulin = "0.25"

[[bench]]
name = "my_benchmark"
harness = false

[profile.test]
debug = true
opt-level = 0
overflow-checks = true
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
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
    
    - name: Run tests
      run: cargo test --verbose
    
    - name: Run integration tests
      run: cargo test --test integration
    
    - name: Generate coverage
      run: |
        cargo install cargo-tarpaulin
        cargo tarpaulin --out xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./cobertura.xml
```

## Documentation Tests

### Doctest Examples
```rust
/// Adds two numbers together.
///
/// # Examples
///
/// ```
/// use my_lib::add;
/// assert_eq!(add(2, 3), 5);
/// ```
///
/// # Panics
///
/// This function will panic if the result overflows:
///
/// ```should_panic
/// use my_lib::add;
/// add(u32::MAX, 1);
/// ```
pub fn add(a: u32, b: u32) -> u32 {
    a + b
}
```

### Running Doctests
```bash
# Run only doctests
cargo test --doc

# Run doctests for specific crate
cargo test --doc --package my-lib

# Run doctests with verbose output
cargo test --doc -- --nocapture
```

## Best Practices

### Test Organization
- Keep unit tests in the same file as the code
- Use integration tests for testing public APIs
- Create test utilities in `tests/common/`
- Use descriptive test names that explain the scenario

### Test Quality
- Test both happy path and error conditions
- Use property-based testing for complex logic
- Mock external dependencies
- Keep tests isolated and independent
- Use `#[should_panic]` for expected panics

### Performance Testing
- Use criterion for benchmarking
- Benchmark critical code paths
- Compare performance across changes
- Set performance budgets in CI

### Coverage Goals
- Aim for 80%+ test coverage
- Use coverage tools to identify untested code
- Focus on testing critical business logic
- Don't chase 100% coverage at the expense of test quality

### Async Testing
- Use `tokio::test` for async tests
- Test timeout scenarios
- Test concurrent operations
- Mock async dependencies appropriately