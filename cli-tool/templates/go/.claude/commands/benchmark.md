# Go Benchmarking

Run performance benchmarks and analyze Go application performance.

## Purpose

This command helps you measure and optimize Go application performance through comprehensive benchmarking and profiling.

## Usage

```
/benchmark $ARGUMENTS
```

## What this command does

1. **Runs performance benchmarks** with detailed metrics
2. **Generates memory allocation reports** 
3. **Creates CPU and memory profiles** for analysis
4. **Compares benchmark results** across runs

## Example Commands

### Basic Benchmarking
```bash
# Run all benchmarks
go test -bench=. ./...

# Run benchmarks with memory stats
go test -bench=. -benchmem ./...

# Run specific benchmark
go test -bench=BenchmarkUserService ./internal/service

# Run benchmarks multiple times for accuracy
go test -bench=. -count=5 ./...
```

### Benchmark Configuration
```bash
# Set benchmark duration
go test -bench=. -benchtime=10s ./...

# Set number of iterations
go test -bench=. -benchtime=1000x ./...

# Run with CPU profiling
go test -bench=. -cpuprofile=cpu.prof ./...

# Run with memory profiling  
go test -bench=. -memprofile=mem.prof ./...

# Run with both profiles
go test -bench=. -cpuprofile=cpu.prof -memprofile=mem.prof ./...
```

### Benchmark Comparison
```bash
# Save baseline benchmark
go test -bench=. -count=5 ./... > baseline.txt

# After optimization, run again
go test -bench=. -count=5 ./... > optimized.txt

# Compare results with benchcmp
benchcmp baseline.txt optimized.txt

# Or use benchstat for statistical analysis
benchstat baseline.txt optimized.txt
```

## Writing Effective Benchmarks

### Basic Benchmark Structure
```go
func BenchmarkUserService_CreateUser(b *testing.B) {
    service := NewUserService()
    user := User{Name: "John", Email: "john@example.com"}
    
    b.ResetTimer() // Reset timer after setup
    
    for i := 0; i < b.N; i++ {
        _ = service.CreateUser(user)
    }
}
```

### Benchmarking with Setup and Teardown
```go
func BenchmarkDatabaseQuery(b *testing.B) {
    // Setup (not measured)
    db := setupTestDB()
    defer db.Close()
    
    query := "SELECT * FROM users WHERE active = true"
    
    b.ResetTimer() // Start measuring from here
    
    for i := 0; i < b.N; i++ {
        rows, err := db.Query(query)
        if err != nil {
            b.Fatal(err)
        }
        rows.Close()
    }
}
```

### Benchmarking Memory Allocations
```go
func BenchmarkStringConcatenation(b *testing.B) {
    strs := []string{"hello", "world", "benchmark", "test"}
    
    b.Run("strings.Join", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            _ = strings.Join(strs, " ")
        }
    })
    
    b.Run("fmt.Sprintf", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            _ = fmt.Sprintf("%s %s %s %s", strs[0], strs[1], strs[2], strs[3])
        }
    })
    
    b.Run("strings.Builder", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            var builder strings.Builder
            for j, str := range strs {
                if j > 0 {
                    builder.WriteString(" ")
                }
                builder.WriteString(str)
            }
            _ = builder.String()
        }
    })
}
```

### Sub-benchmarks for Comparison
```go
func BenchmarkJSONParsing(b *testing.B) {
    data := `{"name":"John","email":"john@example.com","age":30}`
    
    b.Run("json.Unmarshal", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            var user User
            json.Unmarshal([]byte(data), &user)
        }
    })
    
    b.Run("jsoniter", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            var user User
            jsoniter.Unmarshal([]byte(data), &user)
        }
    })
}
```

## Profiling and Analysis

### CPU Profiling
```bash
# Generate CPU profile
go test -bench=. -cpuprofile=cpu.prof ./...

# Analyze with pprof
go tool pprof cpu.prof

# Commands in pprof:
# (pprof) top10          # Show top 10 functions by CPU usage
# (pprof) list funcName  # Show source code for function
# (pprof) web           # Generate web visualization
# (pprof) pdf           # Generate PDF report
```

### Memory Profiling
```bash
# Generate memory profile
go test -bench=. -memprofile=mem.prof ./...

# Analyze memory usage
go tool pprof mem.prof

# Common pprof commands:
# (pprof) top10 -cum     # Top functions by cumulative memory
# (pprof) list funcName  # Memory usage per line
# (pprof) web           # Visual memory graph
```

### Continuous Profiling
```go
// Add to main.go for production profiling
import _ "net/http/pprof"

func main() {
    go func() {
        log.Println(http.ListenAndServe("localhost:6060", nil))
    }()
    
    // Your application code
}

// Access profiles at:
// http://localhost:6060/debug/pprof/
// http://localhost:6060/debug/pprof/profile?seconds=30
// http://localhost:6060/debug/pprof/heap
```

## Performance Optimization Patterns

### String Building
```go
// Inefficient: string concatenation
func buildStringBad(strs []string) string {
    result := ""
    for _, s := range strs {
        result += s
    }
    return result
}

// Efficient: strings.Builder
func buildStringGood(strs []string) string {
    var builder strings.Builder
    builder.Grow(len(strs) * 10) // Pre-allocate capacity
    for _, s := range strs {
        builder.WriteString(s)
    }
    return builder.String()
}
```

### Slice Pre-allocation
```go
// Inefficient: growing slice
func processItemsBad(items []Item) []Result {
    var results []Result
    for _, item := range items {
        results = append(results, process(item))
    }
    return results
}

// Efficient: pre-allocated slice
func processItemsGood(items []Item) []Result {
    results := make([]Result, 0, len(items))
    for _, item := range items {
        results = append(results, process(item))
    }
    return results
}
```

### Object Pooling
```go
var bufferPool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 0, 1024)
    },
}

func processDataWithPool(data []byte) []byte {
    buf := bufferPool.Get().([]byte)
    defer func() {
        bufferPool.Put(buf[:0]) // Reset length but keep capacity
    }()
    
    // Process data using buf
    return append(buf, processedData...)
}
```

## Benchmark Analysis Tools

### benchstat
```bash
# Install benchstat
go install golang.org/x/perf/cmd/benchstat@latest

# Compare benchmarks with statistical analysis
benchstat old.txt new.txt

# Example output:
# name           old time/op    new time/op    delta
# ProcessData-8    1.23ms ± 2%    0.95ms ± 3%  -22.76%  (p=0.000 n=10+10)
```

### benchcmp (Legacy)
```bash
# Install benchcmp
go get golang.org/x/tools/cmd/benchcmp

# Simple comparison
benchcmp old.txt new.txt
```

## CI/CD Integration

### GitHub Actions Benchmark
```yaml
name: Benchmark
on: [push, pull_request]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-go@v3
      with:
        go-version: 1.21
    
    - name: Run Benchmarks
      run: |
        go test -bench=. -benchmem -run=^$ ./... | tee benchmark.txt
        
    - name: Upload Benchmark Results
      uses: actions/upload-artifact@v3
      with:
        name: benchmark-results
        path: benchmark.txt
```

## Best Practices

- Run benchmarks multiple times (`-count=5`) for statistical significance
- Use `b.ResetTimer()` after expensive setup operations
- Benchmark both CPU performance and memory allocations
- Compare benchmarks before and after optimizations
- Profile your code to identify bottlenecks
- Pre-allocate slices and maps when size is known
- Use object pooling for frequently allocated objects
- Avoid benchmarking in noisy environments
- Keep benchmark functions focused on single operations
- Document performance requirements and track regressions