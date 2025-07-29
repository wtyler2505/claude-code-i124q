# Rust Testing Framework

Run comprehensive tests including unit tests, integration tests, benchmarks, and property-based tests.

## Purpose

This command helps you run and organize Rust tests effectively using cargo's built-in testing framework and additional testing libraries.

## Usage

```
/test $ARGUMENTS
```

## What this command does

1. **Runs unit and integration tests** with cargo test
2. **Executes benchmarks** for performance analysis
3. **Generates test coverage reports** with coverage tools  
4. **Supports property-based testing** with proptest

## Example Commands

### Basic Testing
```bash
# Run all tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Run specific test
cargo test test_function_name

# Run tests matching pattern
cargo test user_

# Run tests in specific module
cargo test user::tests

# Run ignored tests
cargo test -- --ignored

# Run both normal and ignored tests
cargo test -- --include-ignored
```

### Test Configuration
```bash
# Run tests with specific number of threads
cargo test -- --test-threads=1

# Run tests verbosely
cargo test -- --verbose

# Show test output even for passing tests
cargo test -- --show-output

# Run tests and stop on first failure
cargo test -- --fail-fast

# Set custom test timeout
cargo test -- --timeout 60
```

### Integration and Doc Tests
```bash
# Run only unit tests
cargo test --lib

# Run only integration tests
cargo test --test integration_test

# Run only documentation tests
cargo test --doc

# Run specific integration test file
cargo test --test user_integration
```

## Test Organization

### Unit Tests
```rust
// src/lib.rs or src/main.rs
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("Division by zero".to_string())
    } else {
        Ok(a / b)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
        assert_eq!(add(-1, 1), 0);
        assert_eq!(add(0, 0), 0);
    }

    #[test]
    fn test_divide_success() {
        assert_eq!(divide(10.0, 2.0), Ok(5.0));
        assert_eq!(divide(3.0, 2.0), Ok(1.5));
    }

    #[test]
    fn test_divide_by_zero() {
        assert_eq!(divide(10.0, 0.0), Err("Division by zero".to_string()));
    }

    #[test]
    #[should_panic]
    fn test_panic() {
        panic!("This test should panic");
    }

    #[test]
    #[should_panic(expected = "index out of bounds")]
    fn test_panic_with_message() {
        let v = vec![1, 2, 3];
        v[4]; // This should panic with index out of bounds
    }

    #[test]
    #[ignore]
    fn expensive_test() {
        // This test is ignored by default
        // Run with: cargo test -- --ignored
    }
}
```

### Integration Tests
```rust
// tests/integration_test.rs
use my_crate::*;

#[test]
fn test_integration() {
    let result = add(5, 10);
    assert_eq!(result, 15);
}

#[test]
fn test_full_workflow() {
    // Test the entire workflow
    let input = "test input";
    let processed = process_input(input);
    let output = generate_output(processed);
    
    assert!(output.is_ok());
    assert_eq!(output.unwrap(), expected_output());
}
```

### Async Tests
```rust
#[cfg(test)]
mod async_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_async_function() {
        let result = async_function().await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_timeout() {
        let future = slow_async_function();
        let result = tokio::time::timeout(
            std::time::Duration::from_secs(1), 
            future
        ).await;
        
        assert!(result.is_ok());
    }
}
```

## Advanced Testing Patterns

### Property-Based Testing
```rust
// Add to Cargo.toml:
// [dev-dependencies]
// proptest = "1.0"

use proptest::prelude::*;

proptest! {
    #[test]
    fn test_add_commutative(a in 0..1000i32, b in 0..1000i32) {
        prop_assert_eq!(add(a, b), add(b, a));
    }

    #[test]
    fn test_string_roundtrip(s in ".*") {
        let encoded = encode(&s);
        let decoded = decode(&encoded).unwrap();
        prop_assert_eq!(s, decoded);
    }

    #[test]
    fn test_sort_idempotent(mut vec in prop::collection::vec(0..100i32, 0..100)) {
        let sorted_once = {
            vec.sort();
            vec.clone()
        };
        
        vec.sort();
        prop_assert_eq!(vec, sorted_once);
    }
}

// Custom strategies
prop_compose! {
    fn valid_email()(
        name in "[a-z]{1,20}",
        domain in "[a-z]{1,20}",
        tld in "[a-z]{2,4}"
    ) -> String {
        format!("{}@{}.{}", name, domain, tld)
    }
}

proptest! {
    #[test]
    fn test_email_validation(email in valid_email()) {
        prop_assert!(is_valid_email(&email));
    }
}
```

### Parameterized Tests
```rust
use rstest::*;

#[rstest]
#[case(2, 3, 5)]
#[case(10, -5, 5)]
#[case(0, 0, 0)]
fn test_add_cases(#[case] a: i32, #[case] b: i32, #[case] expected: i32) {
    assert_eq!(add(a, b), expected);
}

#[rstest]
#[values("hello", "world", "test")]
fn test_string_length(input: &str) {
    assert!(input.len() > 0);
}

#[fixture]
fn database() -> Database {
    Database::new_in_memory()
}

#[rstest]
fn test_user_creation(database: Database) {
    let user = User::new("John", "john@example.com");
    let id = database.insert_user(user).unwrap();
    assert!(id > 0);
}
```

### Mock Testing
```rust
use mockall::*;

#[automock]
trait UserRepository {
    fn get_user(&self, id: u32) -> Result<User, Error>;
    fn save_user(&mut self, user: &User) -> Result<(), Error>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_service_get_user() {
        let mut mock_repo = MockUserRepository::new();
        
        mock_repo
            .expect_get_user()
            .with(eq(1))
            .times(1)
            .returning(|_| Ok(User { id: 1, name: "John".to_string() }));

        let service = UserService::new(mock_repo);
        let user = service.get_user(1).unwrap();
        
        assert_eq!(user.id, 1);
        assert_eq!(user.name, "John");
    }

    #[test]
    fn test_user_service_save_user() {
        let mut mock_repo = MockUserRepository::new();
        let user = User { id: 1, name: "John".to_string() };
        
        mock_repo
            .expect_save_user()
            .with(eq(user.clone()))
            .times(1)
            .returning(|_| Ok(()));

        let mut service = UserService::new(mock_repo);
        let result = service.save_user(&user);
        
        assert!(result.is_ok());
    }
}
```

## Test Coverage

### Using cargo-tarpaulin
```bash
# Install tarpaulin
cargo install cargo-tarpaulin

# Run tests with coverage
cargo tarpaulin

# Generate HTML report
cargo tarpaulin --out Html

# Generate XML report for CI
cargo tarpaulin --out Xml

# Exclude files from coverage
cargo tarpaulin --exclude-files 'src/generated/*'

# Set minimum coverage threshold
cargo tarpaulin --fail-under 80
```

### Coverage Configuration
```toml
# Cargo.toml
[package.metadata.tarpaulin]
exclude = ["src/generated/*", "tests/*"]
fail-under = 80
out = ["Html", "Xml"]
```

### Using cargo-llvm-cov
```bash
# Install cargo-llvm-cov  
cargo install cargo-llvm-cov

# Run tests with coverage
cargo llvm-cov

# Generate HTML report
cargo llvm-cov --html

# Generate lcov report
cargo llvm-cov --lcov --output-path coverage.lcov
```

## Benchmarking

### Using Criterion
```rust
// Add to Cargo.toml:
// [dev-dependencies]
// criterion = "0.5"
//
// [[bench]]
// name = "my_benchmark"
// harness = false

use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn fibonacci_recursive(n: u64) -> u64 {
    match n {
        0 => 1,
        1 => 1,
        n => fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2),
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
    for i in [10, 15, 20].iter() {
        group.bench_with_input(
            format!("recursive/{}", i), 
            i, 
            |b, i| b.iter(|| fibonacci_recursive(black_box(*i)))
        );
        
        group.bench_with_input(
            format!("iterative/{}", i), 
            i, 
            |b, i| b.iter(|| fibonacci_iterative(black_box(*i)))
        );
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

# Save baseline for comparison
cargo bench -- --save-baseline before_optimization

# Compare with baseline
cargo bench -- --baseline before_optimization
```

## Test Helpers and Utilities

### Test Setup and Teardown
```rust
use std::sync::Once;

static INIT: Once = Once::new();

fn setup() {
    INIT.call_once(|| {
        env_logger::init();
        // Other one-time setup
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_with_setup() {
        setup();
        // Your test code here
    }
}
```

### Test Data Builders
```rust
#[cfg(test)]
mod test_helpers {
    use super::*;

    pub struct UserBuilder {
        id: u32,
        name: String,
        email: String,
        active: bool,
    }

    impl UserBuilder {
        pub fn new() -> Self {
            Self {
                id: 1,
                name: "Default User".to_string(),
                email: "user@example.com".to_string(),
                active: true,
            }
        }

        pub fn with_id(mut self, id: u32) -> Self {
            self.id = id;
            self
        }

        pub fn with_name<S: Into<String>>(mut self, name: S) -> Self {
            self.name = name.into();
            self
        }

        pub fn with_email<S: Into<String>>(mut self, email: S) -> Self {
            self.email = email.into();
            self
        }

        pub fn inactive(mut self) -> Self {
            self.active = false;
            self
        }

        pub fn build(self) -> User {
            User {
                id: self.id,
                name: self.name,
                email: self.email,
                active: self.active,
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::test_helpers::*;

    #[test]
    fn test_user_creation() {
        let user = UserBuilder::new()
            .with_name("John Doe")
            .with_email("john@example.com")
            .build();

        assert_eq!(user.name, "John Doe");
        assert_eq!(user.email, "john@example.com");
        assert!(user.active);
    }
}
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Install Rust
      uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        override: true
        components: rustfmt, clippy
    
    - name: Run tests
      run: cargo test --all-features
    
    - name: Run clippy
      run: cargo clippy -- -D warnings
    
    - name: Check formatting
      run: cargo fmt -- --check

  coverage:
    name: Coverage
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        override: true
    
    - name: Install tarpaulin
      run: cargo install cargo-tarpaulin
    
    - name: Generate coverage
      run: cargo tarpaulin --verbose --all-features --workspace --timeout 120 --out Xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./cobertura.xml
```

## Best Practices

- Write tests for all public APIs
- Use descriptive test names that explain the scenario
- Test both success and failure cases
- Keep tests independent and deterministic  
- Use property-based testing for complex logic
- Mock external dependencies in unit tests
- Write integration tests for user workflows
- Measure and maintain good test coverage
- Use benchmarks to prevent performance regressions
- Run tests in CI/CD pipelines
- Use test data builders for complex test objects
- Document test setup requirements