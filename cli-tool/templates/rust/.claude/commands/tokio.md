# Tokio Async Runtime

Harness the power of Tokio for building high-performance async applications in Rust.

## Purpose

This command helps you develop asynchronous applications using Tokio runtime, focusing on async/await patterns, concurrency, and I/O operations.

## Usage

```
/tokio $ARGUMENTS
```

## What this command does

1. **Sets up Tokio runtime** with proper configuration
2. **Manages async tasks** and concurrent operations
3. **Handles async I/O** for networking and file operations
4. **Implements channels** for inter-task communication
5. **Provides timing and scheduling** utilities

## Example Commands

### Basic Runtime Setup
```rust
use tokio;

#[tokio::main]
async fn main() {
    println!("Hello, Tokio!");
    
    // Basic async operation
    let result = async_operation().await;
    println!("Result: {}", result);
}

async fn async_operation() -> i32 {
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    42
}
```

### Manual Runtime Creation
```rust
use tokio::runtime::Runtime;

fn main() {
    // Create a single-threaded runtime
    let rt = Runtime::new().unwrap();
    
    rt.block_on(async {
        println!("Running on Tokio runtime");
        async_task().await;
    });
}

// Multi-threaded runtime with custom configuration
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let rt = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(4)
        .thread_name("tokio-worker")
        .enable_all()
        .build()?;
    
    rt.block_on(async {
        // Your async code here
        concurrent_tasks().await;
    });
    
    Ok(())
}

async fn concurrent_tasks() {
    let task1 = tokio::spawn(async { work_task("Task 1").await });
    let task2 = tokio::spawn(async { work_task("Task 2").await });
    let task3 = tokio::spawn(async { work_task("Task 3").await });
    
    let results = tokio::try_join!(task1, task2, task3);
    match results {
        Ok((r1, r2, r3)) => println!("Results: {}, {}, {}", r1, r2, r3),
        Err(e) => eprintln!("Task failed: {}", e),
    }
}

async fn work_task(name: &str) -> String {
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    format!("{} completed", name)
}
```

### Task Management
```rust
use tokio::task::{JoinHandle, JoinSet};
use std::time::Duration;

#[tokio::main]
async fn main() {
    // Spawning individual tasks
    let handle1 = tokio::spawn(async {
        tokio::time::sleep(Duration::from_millis(100)).await;
        "Task 1 done"
    });
    
    let handle2 = tokio::spawn(async {
        tokio::time::sleep(Duration::from_millis(200)).await;
        "Task 2 done"
    });
    
    // Wait for both tasks
    let (result1, result2) = tokio::join!(handle1, handle2);
    println!("{:?}, {:?}", result1, result2);
    
    // Using JoinSet for dynamic task management
    let mut set = JoinSet::new();
    
    for i in 0..5 {
        set.spawn(async move {
            tokio::time::sleep(Duration::from_millis(i * 50)).await;
            format!("Task {} completed", i)
        });
    }
    
    while let Some(result) = set.join_next().await {
        match result {
            Ok(value) => println!("{}", value),
            Err(e) => eprintln!("Task panicked: {}", e),
        }
    }
}

// Task with timeout
async fn task_with_timeout() -> Result<String, tokio::time::error::Elapsed> {
    tokio::time::timeout(Duration::from_secs(5), async {
        // Long-running operation
        long_running_task().await
    }).await
}

async fn long_running_task() -> String {
    tokio::time::sleep(Duration::from_secs(2)).await;
    "Task completed within timeout".to_string()
}

// Cancellation-aware task
async fn cancellation_aware_task(mut shutdown: tokio::sync::watch::Receiver<bool>) {
    loop {
        tokio::select! {
            _ = tokio::time::sleep(Duration::from_secs(1)) => {
                println!("Working...");
            }
            _ = shutdown.changed() => {
                println!("Shutdown signal received");
                break;
            }
        }
    }
}
```

### Channels and Communication
```rust
use tokio::sync::{mpsc, oneshot, broadcast, watch};

#[tokio::main]
async fn main() {
    // MPSC (Multi-Producer, Single-Consumer) channel
    mpsc_example().await;
    
    // Oneshot channel for single value
    oneshot_example().await;
    
    // Broadcast channel for multiple consumers
    broadcast_example().await;
    
    // Watch channel for state updates
    watch_example().await;
}

async fn mpsc_example() {
    let (tx, mut rx) = mpsc::channel(32);
    
    // Spawn producer tasks
    for i in 0..5 {
        let tx_clone = tx.clone();
        tokio::spawn(async move {
            let msg = format!("Message {}", i);
            if let Err(_) = tx_clone.send(msg).await {
                println!("Receiver closed");
            }
        });
    }
    
    drop(tx); // Close the sender
    
    // Receive messages
    while let Some(message) = rx.recv().await {
        println!("Received: {}", message);
    }
}

async fn oneshot_example() {
    let (tx, rx) = oneshot::channel();
    
    tokio::spawn(async move {
        // Simulate some work
        tokio::time::sleep(Duration::from_millis(100)).await;
        let result = "Computation result";
        
        if let Err(_) = tx.send(result.to_string()) {
            println!("Receiver was dropped");
        }
    });
    
    match rx.await {
        Ok(result) => println!("Got result: {}", result),
        Err(_) => println!("Sender was dropped"),
    }
}

async fn broadcast_example() {
    let (tx, _) = broadcast::channel(16);
    
    // Create multiple receivers
    let mut rx1 = tx.subscribe();
    let mut rx2 = tx.subscribe();
    let mut rx3 = tx.subscribe();
    
    // Spawn receivers
    tokio::spawn(async move {
        while let Ok(msg) = rx1.recv().await {
            println!("Receiver 1: {}", msg);
        }
    });
    
    tokio::spawn(async move {
        while let Ok(msg) = rx2.recv().await {
            println!("Receiver 2: {}", msg);
        }
    });
    
    tokio::spawn(async move {
        while let Ok(msg) = rx3.recv().await {
            println!("Receiver 3: {}", msg);
        }
    });
    
    // Send messages
    for i in 0..5 {
        let msg = format!("Broadcast message {}", i);
        if let Err(_) = tx.send(msg) {
            println!("No receivers");
            break;
        }
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
}

async fn watch_example() {
    let (tx, mut rx) = watch::channel("initial");
    
    // Spawn a task to watch for changes
    tokio::spawn(async move {
        while rx.changed().await.is_ok() {
            let value = rx.borrow().clone();
            println!("Value changed to: {}", value);
        }
    });
    
    // Update values
    for i in 1..=5 {
        let new_value = format!("value_{}", i);
        if let Err(_) = tx.send(new_value) {
            println!("No receivers");
            break;
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
}
```

### Async I/O Operations
```rust
use tokio::fs::{File, OpenOptions};
use tokio::io::{AsyncReadExt, AsyncWriteExt, BufReader, BufWriter};
use tokio::net::{TcpListener, TcpStream};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // File I/O examples
    file_operations().await?;
    
    // Network I/O examples
    network_operations().await?;
    
    Ok(())
}

async fn file_operations() -> Result<(), Box<dyn std::error::Error>> {
    // Writing to a file
    let mut file = File::create("example.txt").await?;
    file.write_all(b"Hello, Tokio file I/O!").await?;
    file.flush().await?;
    
    // Reading from a file
    let mut file = File::open("example.txt").await?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).await?;
    println!("File contents: {}", contents);
    
    // Buffered file operations
    let file = File::open("example.txt").await?;
    let mut reader = BufReader::new(file);
    let mut line = String::new();
    reader.read_line(&mut line).await?;
    println!("First line: {}", line.trim());
    
    // Appending to a file
    let file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("log.txt")
        .await?;
    let mut writer = BufWriter::new(file);
    writer.write_all(b"\nNew log entry").await?;
    writer.flush().await?;
    
    Ok(())
}

async fn network_operations() -> Result<(), Box<dyn std::error::Error>> {
    // Start a simple TCP server
    tokio::spawn(async {
        tcp_server().await.unwrap();
    });
    
    // Give the server time to start
    tokio::time::sleep(Duration::from_millis(100)).await;
    
    // Connect as a client
    tcp_client().await?;
    
    Ok(())
}

async fn tcp_server() -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("Server listening on 127.0.0.1:8080");
    
    loop {
        let (socket, addr) = listener.accept().await?;
        println!("New connection from: {}", addr);
        
        tokio::spawn(async move {
            handle_client(socket).await;
        });
    }
}

async fn handle_client(mut socket: TcpStream) {
    let mut buffer = [0; 1024];
    
    loop {
        match socket.read(&mut buffer).await {
            Ok(0) => {
                println!("Client disconnected");
                break;
            }
            Ok(n) => {
                let message = String::from_utf8_lossy(&buffer[..n]);
                println!("Received: {}", message);
                
                // Echo back
                if let Err(e) = socket.write_all(&buffer[..n]).await {
                    eprintln!("Failed to write to socket: {}", e);
                    break;
                }
            }
            Err(e) => {
                eprintln!("Failed to read from socket: {}", e);
                break;
            }
        }
    }
}

async fn tcp_client() -> Result<(), Box<dyn std::error::Error>> {
    let mut stream = TcpStream::connect("127.0.0.1:8080").await?;
    
    // Send a message
    stream.write_all(b"Hello from client!").await?;
    
    // Read response
    let mut buffer = [0; 1024];
    let n = stream.read(&mut buffer).await?;
    let response = String::from_utf8_lossy(&buffer[..n]);
    println!("Server response: {}", response);
    
    Ok(())
}
```

### Synchronization Primitives
```rust
use tokio::sync::{Mutex, RwLock, Semaphore, Barrier};
use std::sync::Arc;

#[tokio::main]
async fn main() {
    // Mutex example
    mutex_example().await;
    
    // RwLock example
    rwlock_example().await;
    
    // Semaphore example
    semaphore_example().await;
    
    // Barrier example
    barrier_example().await;
}

async fn mutex_example() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    
    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = tokio::spawn(async move {
            let mut num = counter.lock().await;
            *num += 1;
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.await.unwrap();
    }
    
    println!("Final counter value: {}", *counter.lock().await);
}

async fn rwlock_example() {
    let data = Arc::new(RwLock::new(vec![1, 2, 3, 4, 5]));
    let mut handles = vec![];
    
    // Spawn readers
    for i in 0..5 {
        let data = Arc::clone(&data);
        let handle = tokio::spawn(async move {
            let reader = data.read().await;
            println!("Reader {}: {:?}", i, *reader);
        });
        handles.push(handle);
    }
    
    // Spawn a writer
    let data_writer = Arc::clone(&data);
    let write_handle = tokio::spawn(async move {
        let mut writer = data_writer.write().await;
        writer.push(6);
        println!("Writer: Added 6 to the vector");
    });
    handles.push(write_handle);
    
    for handle in handles {
        handle.await.unwrap();
    }
}

async fn semaphore_example() {
    let semaphore = Arc::new(Semaphore::new(3)); // Allow 3 concurrent tasks
    let mut handles = vec![];
    
    for i in 0..10 {
        let semaphore = Arc::clone(&semaphore);
        let handle = tokio::spawn(async move {
            let _permit = semaphore.acquire().await.unwrap();
            println!("Task {} is running", i);
            tokio::time::sleep(Duration::from_millis(100)).await;
            println!("Task {} completed", i);
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.await.unwrap();
    }
}

async fn barrier_example() {
    let barrier = Arc::new(Barrier::new(3));
    let mut handles = vec![];
    
    for i in 0..3 {
        let barrier = Arc::clone(&barrier);
        let handle = tokio::spawn(async move {
            println!("Task {} is preparing", i);
            tokio::time::sleep(Duration::from_millis(i * 100)).await;
            
            println!("Task {} is waiting at barrier", i);
            barrier.wait().await;
            
            println!("Task {} passed the barrier", i);
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.await.unwrap();
    }
}
```

### Timers and Intervals
```rust
use tokio::time::{interval, sleep, timeout, Duration, Instant};

#[tokio::main]
async fn main() {
    // Basic sleep
    sleep_example().await;
    
    // Interval example
    interval_example().await;
    
    // Timeout example
    timeout_example().await;
    
    // Advanced timing
    advanced_timing().await;
}

async fn sleep_example() {
    println!("Starting sleep example");
    sleep(Duration::from_millis(500)).await;
    println!("Woke up after 500ms");
}

async fn interval_example() {
    let mut interval = interval(Duration::from_millis(200));
    let mut count = 0;
    
    loop {
        interval.tick().await;
        count += 1;
        println!("Interval tick #{}", count);
        
        if count >= 5 {
            break;
        }
    }
}

async fn timeout_example() {
    // Task that completes within timeout
    match timeout(Duration::from_secs(2), short_task()).await {
        Ok(result) => println!("Task completed: {}", result),
        Err(_) => println!("Task timed out"),
    }
    
    // Task that times out
    match timeout(Duration::from_millis(500), long_task()).await {
        Ok(result) => println!("Task completed: {}", result),
        Err(_) => println!("Task timed out"),
    }
}

async fn short_task() -> String {
    sleep(Duration::from_millis(100)).await;
    "Short task done".to_string()
}

async fn long_task() -> String {
    sleep(Duration::from_secs(2)).await;
    "Long task done".to_string()
}

async fn advanced_timing() {
    let start = Instant::now();
    
    // Create a deadline
    let deadline = start + Duration::from_secs(1);
    
    // Sleep until deadline
    tokio::time::sleep_until(deadline).await;
    
    println!("Elapsed: {:?}", start.elapsed());
    
    // Interval with immediate first tick
    let mut interval = interval(Duration::from_millis(100));
    interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
    
    for i in 0..3 {
        interval.tick().await;
        println!("Immediate interval tick #{}", i);
    }
}
```

### Error Handling and Recovery
```rust
use tokio::task::JoinError;
use std::panic;

#[tokio::main]
async fn main() {
    // Handle task panics
    handle_panics().await;
    
    // Retry with backoff
    retry_with_backoff().await;
    
    // Circuit breaker pattern
    circuit_breaker_example().await;
}

async fn handle_panics() {
    let handle = tokio::spawn(async {
        panic!("This task panics!");
    });
    
    match handle.await {
        Ok(_) => println!("Task completed successfully"),
        Err(e) => {
            if e.is_panic() {
                println!("Task panicked: {:?}", e);
            } else if e.is_cancelled() {
                println!("Task was cancelled");
            }
        }
    }
}

async fn retry_with_backoff() {
    let max_retries = 3;
    let mut attempt = 0;
    
    loop {
        attempt += 1;
        
        match unreliable_operation().await {
            Ok(result) => {
                println!("Operation succeeded: {}", result);
                break;
            }
            Err(e) => {
                println!("Attempt {} failed: {}", attempt, e);
                
                if attempt >= max_retries {
                    println!("Max retries exceeded");
                    break;
                }
                
                // Exponential backoff
                let delay = Duration::from_millis(100 * 2_u64.pow(attempt - 1));
                sleep(delay).await;
            }
        }
    }
}

async fn unreliable_operation() -> Result<String, &'static str> {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    
    if rng.gen_bool(0.7) {
        Err("Operation failed")
    } else {
        Ok("Operation successful".to_string())
    }
}

// Simple circuit breaker implementation
struct CircuitBreaker {
    failure_count: usize,
    failure_threshold: usize,
    recovery_timeout: Duration,
    last_failure_time: Option<Instant>,
}

impl CircuitBreaker {
    fn new(failure_threshold: usize, recovery_timeout: Duration) -> Self {
        Self {
            failure_count: 0,
            failure_threshold,
            recovery_timeout,
            last_failure_time: None,
        }
    }
    
    fn is_open(&self) -> bool {
        if self.failure_count >= self.failure_threshold {
            if let Some(last_failure) = self.last_failure_time {
                Instant::now() - last_failure < self.recovery_timeout
            } else {
                true
            }
        } else {
            false
        }
    }
    
    fn record_success(&mut self) {
        self.failure_count = 0;
        self.last_failure_time = None;
    }
    
    fn record_failure(&mut self) {
        self.failure_count += 1;
        self.last_failure_time = Some(Instant::now());
    }
}

async fn circuit_breaker_example() {
    let mut circuit_breaker = CircuitBreaker::new(3, Duration::from_secs(5));
    
    for i in 0..10 {
        if circuit_breaker.is_open() {
            println!("Circuit breaker is open, skipping request {}", i);
            sleep(Duration::from_millis(100)).await;
            continue;
        }
        
        match unreliable_service_call().await {
            Ok(result) => {
                println!("Request {} succeeded: {}", i, result);
                circuit_breaker.record_success();
            }
            Err(e) => {
                println!("Request {} failed: {}", i, e);
                circuit_breaker.record_failure();
            }
        }
        
        sleep(Duration::from_millis(100)).await;
    }
}

async fn unreliable_service_call() -> Result<String, &'static str> {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    
    // Simulate network delay
    sleep(Duration::from_millis(rng.gen_range(10..100))).await;
    
    if rng.gen_bool(0.6) {
        Err("Service unavailable")
    } else {
        Ok("Service response".to_string())
    }
}
```

### Testing Async Code
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tokio::test;

    #[tokio::test]
    async fn test_async_function() {
        let result = async_operation().await;
        assert_eq!(result, 42);
    }

    #[tokio::test]
    async fn test_timeout() {
        let result = timeout(Duration::from_millis(50), long_task()).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_channels() {
        let (tx, mut rx) = mpsc::channel(1);
        
        tx.send("test message".to_string()).await.unwrap();
        let received = rx.recv().await.unwrap();
        
        assert_eq!(received, "test message");
    }

    #[tokio::test]
    async fn test_concurrent_operations() {
        let start = Instant::now();
        
        let (r1, r2, r3) = tokio::join!(
            short_task(),
            short_task(),
            short_task()
        );
        
        let elapsed = start.elapsed();
        
        // All tasks should complete in roughly the same time as one task
        assert!(elapsed < Duration::from_millis(200));
        assert_eq!(r1, "Short task done");
        assert_eq!(r2, "Short task done");
        assert_eq!(r3, "Short task done");
    }
}
```

## Best Practices

### Runtime Configuration
- Use `#[tokio::main]` for simple applications
- Configure custom runtime for specific needs
- Choose appropriate number of worker threads
- Enable only necessary features

### Task Management
- Use `tokio::spawn` for CPU-bound tasks
- Use `tokio::task::spawn_blocking` for blocking operations
- Handle task panics appropriately
- Implement proper cancellation

### Error Handling
- Use `Result` types for recoverable errors
- Implement retry logic with backoff
- Use circuit breakers for external services
- Log errors appropriately

### Performance Optimization
- Avoid blocking operations in async context
- Use appropriate channel types
- Implement backpressure mechanisms
- Profile async applications with tokio-console

### Resource Management
- Close channels and connections properly
- Use timeouts for external operations
- Implement graceful shutdown
- Monitor resource usage