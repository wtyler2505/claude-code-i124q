# Rust Benchmarking

Comprehensive performance benchmarking and profiling for Rust applications.

## Purpose

This command helps you measure and optimize Rust application performance through detailed benchmarking, profiling, and performance analysis.

## Usage

```
/benchmark $ARGUMENTS
```

## What this command does

1. **Runs performance benchmarks** with statistical analysis
2. **Generates profiling data** for CPU and memory usage
3. **Compares performance** across different implementations
4. **Provides optimization guidance** based on measurements
5. **Integrates with CI/CD** for performance regression detection

## Example Commands

### Basic Benchmarking
```bash
# Run all benchmarks
cargo bench

# Run specific benchmark
cargo bench fibonacci

# Run benchmarks with specific pattern
cargo bench --bench my_benchmarks string_ops

# Run benchmarks with features
cargo bench --features=simd
```

### Criterion.rs Benchmarking
```bash
# Run criterion benchmarks
cargo bench --bench criterion_benchmarks

# Run with specific baseline
cargo bench -- --save-baseline my-baseline

# Compare with baseline
cargo bench -- --baseline my-baseline

# Generate HTML report
cargo bench -- --output-format html
```

### Profiling
```bash
# Install profiling tools
cargo install flamegraph
cargo install cargo-profiler

# Generate flamegraph
cargo flamegraph --bench my_benchmark

# Profile with perf
cargo profiler perf --bench my_benchmark

# Profile memory usage
cargo profiler valgrind --bench my_benchmark
```

## Writing Benchmarks

### Criterion.rs Benchmarks
```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use std::time::Duration;

// Simple benchmark
fn fibonacci_benchmark(c: &mut Criterion) {
    c.bench_function("fibonacci 20", |b| {
        b.iter(|| fibonacci(black_box(20)))
    });
}

// Parameterized benchmark
fn fibonacci_comparison(c: &mut Criterion) {
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

// Throughput benchmark
fn sorting_benchmark(c: &mut Criterion) {
    let mut group = c.benchmark_group("sorting");
    
    for size in [100, 1000, 10000].iter() {
        let data: Vec<i32> = (0..*size).rev().collect();
        
        group.throughput(criterion::Throughput::Elements(*size as u64));
        group.bench_with_input(BenchmarkId::new("quicksort", size), size, |b, _| {
            b.iter_batched(
                || data.clone(),
                |mut data| {
                    quicksort(&mut data);
                    data
                },
                criterion::BatchSize::SmallInput,
            )
        });
    }
    
    group.finish();
}

// Memory allocation benchmark
fn allocation_benchmark(c: &mut Criterion) {
    c.bench_function("vec_creation", |b| {
        b.iter(|| {
            let mut vec = Vec::new();
            for i in 0..1000 {
                vec.push(black_box(i));
            }
            vec
        })
    });
    
    c.bench_function("vec_with_capacity", |b| {
        b.iter(|| {
            let mut vec = Vec::with_capacity(1000);
            for i in 0..1000 {
                vec.push(black_box(i));
            }
            vec
        })
    });
}

criterion_group!(
    benches,
    fibonacci_benchmark,
    fibonacci_comparison,
    sorting_benchmark,
    allocation_benchmark
);
criterion_main!(benches);
```

### Async Benchmarks
```rust
use criterion::{criterion_group, criterion_main, Criterion};
use tokio::runtime::Runtime;

fn async_benchmark(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    c.bench_function("async_operation", |b| {
        b.to_async(&rt).iter(|| async {
            async_operation().await
        })
    });
    
    c.bench_function("concurrent_operations", |b| {
        b.to_async(&rt).iter(|| async {
            let futures = (0..10).map(|_| async_operation());
            futures::future::join_all(futures).await
        })
    });
}

async fn async_operation() -> u32 {
    tokio::time::sleep(tokio::time::Duration::from_micros(1)).await;
    42
}

criterion_group!(async_benches, async_benchmark);
criterion_main!(async_benches);
```

### Custom Measurements
```rust
use criterion::{criterion_group, criterion_main, Criterion, measurement::WallTime};
use std::time::Instant;

fn custom_measurement_benchmark(c: &mut Criterion) {
    let mut group = c.benchmark_group("custom_measurement");
    
    // Custom measurement with setup
    group.bench_function("database_query", |b| {
        let db = setup_database();
        b.iter_custom(|iters| {
            let start = Instant::now();
            for _ in 0..iters {
                db.query("SELECT * FROM users").unwrap();
            }
            start.elapsed()
        })
    });
    
    group.finish();
}

criterion_group!(custom_benches, custom_measurement_benchmark);
criterion_main!(custom_benches);
```

## Benchmark Configuration

### Criterion Configuration
```rust
use criterion::{Criterion, PlotConfiguration, AxisScale};

fn configured_benchmark(c: &mut Criterion) {
    let mut group = c.benchmark_group("configured");
    
    // Configure sample size
    group.sample_size(1000);
    
    // Configure measurement time
    group.measurement_time(std::time::Duration::from_secs(10));
    
    // Configure warm-up time
    group.warm_up_time(std::time::Duration::from_secs(3));
    
    // Configure plotting
    group.plot_config(PlotConfiguration::default().summary_scale(AxisScale::Logarithmic));
    
    group.bench_function("configured_function", |b| {
        b.iter(|| expensive_operation())
    });
    
    group.finish();
}
```

### Cargo.toml Configuration
```toml
[[bench]]
name = "criterion_benchmarks"
harness = false

[[bench]]
name = "custom_benchmarks"
harness = false
required-features = ["benchmarks"]

[dependencies]
criterion = { version = "0.5", features = ["html_reports"] }

[features]
benchmarks = []
```

## Profiling Tools

### Flamegraph Generation
```bash
# Install flamegraph
cargo install flamegraph

# Generate flamegraph for benchmark
cargo flamegraph --bench my_benchmark

# Generate flamegraph with specific duration
cargo flamegraph --bench my_benchmark -- --bench-duration 30

# Generate flamegraph for specific function
cargo flamegraph --bench my_benchmark -- fibonacci
```

### CPU Profiling
```bash
# Install profiler
cargo install cargo-profiler

# Profile with perf (Linux)
cargo profiler perf --bench my_benchmark

# Profile with instruments (macOS)
cargo profiler instruments --bench my_benchmark

# Profile with custom profiler
cargo profiler custom --bench my_benchmark --profiler vtune
```

### Memory Profiling
```bash
# Profile memory with heaptrack
cargo build --release --bench my_benchmark
heaptrack target/release/deps/my_benchmark-*

# Profile with valgrind
cargo build --release --bench my_benchmark
valgrind --tool=massif target/release/deps/my_benchmark-*

# Profile with cargo-profiler
cargo profiler valgrind --bench my_benchmark
```

## Performance Analysis

### Micro-benchmarks
```rust
use criterion::{black_box, Criterion};

fn string_operations_benchmark(c: &mut Criterion) {
    let mut group = c.benchmark_group("string_operations");
    
    // Test different string concatenation methods
    group.bench_function("string_concat", |b| {
        b.iter(|| {
            let mut result = String::new();
            for i in 0..100 {
                result = result + &i.to_string();
            }
            result
        })
    });
    
    group.bench_function("string_push_str", |b| {
        b.iter(|| {
            let mut result = String::new();
            for i in 0..100 {
                result.push_str(&i.to_string());
            }
            result
        })
    });
    
    group.bench_function("string_format", |b| {
        b.iter(|| {
            let mut result = String::new();
            for i in 0..100 {
                result = format!("{}{}", result, i);
            }
            result
        })
    });
    
    group.finish();
}
```

### Data Structure Benchmarks
```rust
use criterion::{black_box, Criterion, BenchmarkId};
use std::collections::{HashMap, BTreeMap};

fn map_operations_benchmark(c: &mut Criterion) {
    let mut group = c.benchmark_group("map_operations");
    
    for size in [100, 1000, 10000].iter() {
        // HashMap benchmarks
        group.bench_with_input(BenchmarkId::new("hashmap_insert", size), size, |b, size| {
            b.iter_batched(
                || HashMap::new(),
                |mut map| {
                    for i in 0..*size {
                        map.insert(black_box(i), black_box(i * 2));
                    }
                    map
                },
                criterion::BatchSize::SmallInput,
            )
        });
        
        // BTreeMap benchmarks
        group.bench_with_input(BenchmarkId::new("btreemap_insert", size), size, |b, size| {
            b.iter_batched(
                || BTreeMap::new(),
                |mut map| {
                    for i in 0..*size {
                        map.insert(black_box(i), black_box(i * 2));
                    }
                    map
                },
                criterion::BatchSize::SmallInput,
            )
        });
    }
    
    group.finish();
}
```

### Algorithm Comparison
```rust
use criterion::{black_box, Criterion, BenchmarkId};

fn sorting_algorithms_benchmark(c: &mut Criterion) {
    let mut group = c.benchmark_group("sorting_algorithms");
    
    for size in [100, 1000, 10000].iter() {
        let data: Vec<i32> = (0..*size).rev().collect();
        
        group.bench_with_input(BenchmarkId::new("quicksort", size), &data, |b, data| {
            b.iter_batched(
                || data.clone(),
                |mut data| {
                    quicksort(&mut data);
                    data
                },
                criterion::BatchSize::SmallInput,
            )
        });
        
        group.bench_with_input(BenchmarkId::new("mergesort", size), &data, |b, data| {
            b.iter_batched(
                || data.clone(),
                |mut data| {
                    mergesort(&mut data);
                    data
                },
                criterion::BatchSize::SmallInput,
            )
        });
        
        group.bench_with_input(BenchmarkId::new("std_sort", size), &data, |b, data| {
            b.iter_batched(
                || data.clone(),
                |mut data| {
                    data.sort();
                    data
                },
                criterion::BatchSize::SmallInput,
            )
        });
    }
    
    group.finish();
}
```

## Optimization Techniques

### Memory Optimization
```rust
use criterion::{black_box, Criterion};

fn memory_optimization_benchmark(c: &mut Criterion) {
    let mut group = c.benchmark_group("memory_optimization");
    
    // Test pre-allocation vs dynamic allocation
    group.bench_function("dynamic_allocation", |b| {
        b.iter(|| {
            let mut vec = Vec::new();
            for i in 0..1000 {
                vec.push(black_box(i));
            }
            vec
        })
    });
    
    group.bench_function("pre_allocation", |b| {
        b.iter(|| {
            let mut vec = Vec::with_capacity(1000);
            for i in 0..1000 {
                vec.push(black_box(i));
            }
            vec
        })
    });
    
    // Test object pooling
    group.bench_function("object_creation", |b| {
        b.iter(|| {
            let mut objects = Vec::new();
            for _ in 0..100 {
                objects.push(ExpensiveObject::new());
            }
            objects
        })
    });
    
    group.bench_function("object_pooling", |b| {
        let pool = ObjectPool::new();
        b.iter(|| {
            let mut objects = Vec::new();
            for _ in 0..100 {
                objects.push(pool.get());
            }
            // Objects are automatically returned to pool when dropped
        })
    });
    
    group.finish();
}
```

### SIMD Optimizations
```rust
use criterion::{black_box, Criterion};

fn simd_benchmark(c: &mut Criterion) {
    let mut group = c.benchmark_group("simd");
    
    let data: Vec<f32> = (0..1000).map(|i| i as f32).collect();
    
    group.bench_function("scalar_sum", |b| {
        b.iter(|| {
            let mut sum = 0.0;
            for &x in &data {
                sum += black_box(x);
            }
            sum
        })
    });
    
    #[cfg(target_arch = "x86_64")]
    group.bench_function("simd_sum", |b| {
        b.iter(|| {
            simd_sum(&data)
        })
    });
    
    group.finish();
}

#[cfg(target_arch = "x86_64")]
fn simd_sum(data: &[f32]) -> f32 {
    use std::arch::x86_64::*;
    
    unsafe {
        let mut sum = _mm256_setzero_ps();
        let chunks = data.chunks_exact(8);
        
        for chunk in chunks {
            let values = _mm256_loadu_ps(chunk.as_ptr());
            sum = _mm256_add_ps(sum, values);
        }
        
        // Horizontal sum
        let sum = _mm256_hadd_ps(sum, sum);
        let sum = _mm256_hadd_ps(sum, sum);
        let sum128 = _mm256_castps256_ps128(sum);
        let sum128 = _mm_add_ps(sum128, _mm256_extractf128_ps(sum, 1));
        
        _mm_cvtss_f32(sum128)
    }
}
```

## Regression Testing

### Baseline Comparison
```bash
# Save baseline
cargo bench -- --save-baseline before-optimization

# After optimization
cargo bench -- --baseline before-optimization

# Compare specific benchmarks
cargo bench fibonacci -- --baseline before-optimization
```

### CI/CD Integration
```yaml
# .github/workflows/benchmark.yml
name: Benchmark
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        override: true
    
    - name: Run benchmarks
      run: |
        cargo bench -- --output-format json > benchmark_results.json
    
    - name: Store benchmark results
      uses: benchmark-action/github-action-benchmark@v1
      with:
        tool: 'cargo'
        output-file-path: benchmark_results.json
        github-token: ${{ secrets.GITHUB_TOKEN }}
        auto-push: true
```

## Best Practices

### Benchmark Design
- Use `black_box` to prevent compiler optimizations
- Test with realistic data sizes
- Include warm-up phases for accurate measurements
- Use appropriate batch sizes for operations

### Statistical Validity
- Run benchmarks multiple times
- Use sufficient sample sizes
- Account for system noise
- Compare against baselines

### Performance Optimization
- Profile before optimizing
- Focus on hot paths
- Measure the impact of changes
- Consider trade-offs between performance and readability

### CI/CD Integration
- Run benchmarks in controlled environments
- Track performance regressions
- Use consistent hardware for comparisons
- Store historical performance data

### Documentation
- Document benchmark setup and methodology
- Explain performance characteristics
- Include optimization notes
- Provide context for measurements