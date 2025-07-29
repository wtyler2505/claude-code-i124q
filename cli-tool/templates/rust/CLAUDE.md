# Rust Development with Claude Code

Your comprehensive companion for Rust development, featuring memory safety, performance optimization, and modern framework integration.

## 🚀 Quick Start

```bash
# Create new Rust project
cargo new my-project
cd my-project

# Build the project
cargo build

# Run the project
cargo run

# Run tests
cargo test

# Build for release
cargo build --release
```

## 📁 Project Structure

### Standard Rust Project Layout

```
my-project/
├── Cargo.toml              # Package configuration
├── Cargo.lock              # Dependency lock file
├── src/                    # Source code
│   ├── main.rs            # Binary entry point
│   ├── lib.rs             # Library entry point
│   ├── bin/               # Additional binaries
│   ├── modules/           # Module organization
│   └── tests/             # Integration tests
├── tests/                 # Integration tests
├── examples/              # Example code
├── benches/               # Benchmarks
├── build.rs               # Build script
├── README.md              # Documentation
└── target/                # Build artifacts (gitignored)
```

### Web Application Structure
```
web-app/
├── Cargo.toml
├── src/
│   ├── main.rs            # Application entry
│   ├── lib.rs             # Library root
│   ├── config/            # Configuration
│   │   └── mod.rs
│   ├── handlers/          # Request handlers
│   │   ├── mod.rs
│   │   ├── auth.rs
│   │   └── users.rs
│   ├── models/            # Data models  
│   │   ├── mod.rs
│   │   └── user.rs
│   ├── services/          # Business logic
│   │   ├── mod.rs
│   │   └── user_service.rs
│   ├── middleware/        # Custom middleware
│   │   └── mod.rs
│   └── utils/             # Utilities
│       └── mod.rs
├── migrations/            # Database migrations
├── static/                # Static assets
└── templates/             # Templates
```

## 🛠 Available Commands

Use these slash commands for Rust development:

### Core Development
- `/build` - Build your Rust project with optimizations
- `/test` - Run tests with coverage and benchmarks
- `/lint` - Run Clippy linter and rustfmt formatter
- `/benchmark` - Run performance benchmarks
- `/cargo` - Manage dependencies and Cargo operations

### Framework-Specific
- `/axum` - Create Axum web service components
- `/warp` - Generate Warp filter-based handlers  
- `/actix` - Build Actix-web application routes
- `/tokio` - Async runtime and utilities

### Advanced Features
- `/unsafe` - Analyze unsafe code blocks
- `/profile` - Performance profiling and optimization
- `/cross` - Cross-compilation setup

## 🏗 Framework Integration

### Axum Web Framework
```rust
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::net::TcpListener;

#[derive(Serialize, Deserialize)]
struct User {
    id: u32,
    name: String,
    email: String,
}

#[derive(Deserialize)]
struct CreateUser {
    name: String,
    email: String,
}

type SharedState = std::sync::Arc<tokio::sync::Mutex<HashMap<u32, User>>>;

async fn health() -> &'static str {
    "OK"
}

async fn get_users(State(state): State<SharedState>) -> Json<Vec<User>> {
    let users = state.lock().await;
    let users_vec: Vec<User> = users.values().cloned().collect();
    Json(users_vec)
}

async fn get_user(
    Path(id): Path<u32>,
    State(state): State<SharedState>,
) -> Result<Json<User>, StatusCode> {
    let users = state.lock().await;
    match users.get(&id) {
        Some(user) => Ok(Json(user.clone())),
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn create_user(
    State(state): State<SharedState>,
    Json(payload): Json<CreateUser>,
) -> Result<Json<User>, StatusCode> {
    let mut users = state.lock().await;
    let id = users.len() as u32 + 1;
    let user = User {
        id,
        name: payload.name,
        email: payload.email,
    };
    users.insert(id, user.clone());
    Ok(Json(user))
}

#[tokio::main]
async fn main() {
    let shared_state = SharedState::default();

    let app = Router::new()
        .route("/health", get(health))
        .route("/users", get(get_users).post(create_user))
        .route("/users/:id", get(get_user))
        .with_state(shared_state);

    let listener = TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Server running on http://0.0.0.0:3000");
    axum::serve(listener, app).await.unwrap();
}
```

### Warp Web Framework
```rust
use warp::{http::StatusCode, Filter};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Debug, Deserialize, Serialize, Clone)]
struct User {
    id: u32,
    name: String,
    email: String,
}

type Users = Arc<Mutex<HashMap<u32, User>>>;

fn with_users(users: Users) -> impl Filter<Extract = (Users,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || users.clone())
}

async fn get_users(users: Users) -> Result<impl warp::Reply, warp::Rejection> {
    let users_guard = users.lock().unwrap();
    let users_vec: Vec<User> = users_guard.values().cloned().collect();
    Ok(warp::reply::json(&users_vec))
}

async fn get_user(id: u32, users: Users) -> Result<impl warp::Reply, warp::Rejection> {
    let users_guard = users.lock().unwrap();
    match users_guard.get(&id) {
        Some(user) => Ok(warp::reply::json(user)),
        None => Err(warp::reject::not_found()),
    }
}

async fn create_user(user: User, users: Users) -> Result<impl warp::Reply, warp::Rejection> {
    let mut users_guard = users.lock().unwrap();
    let id = users_guard.len() as u32 + 1;
    let new_user = User { id, ..user };
    users_guard.insert(id, new_user.clone());
    Ok(warp::reply::with_status(warp::reply::json(&new_user), StatusCode::CREATED))
}

#[tokio::main]
async fn main() {
    let users: Users = Arc::new(Mutex::new(HashMap::new()));

    let health = warp::path("health")
        .and(warp::get())
        .map(|| "OK");

    let get_users_route = warp::path("users")
        .and(warp::get())
        .and(with_users(users.clone()))
        .and_then(get_users);

    let get_user_route = warp::path!("users" / u32)
        .and(warp::get())
        .and(with_users(users.clone()))
        .and_then(get_user);

    let create_user_route = warp::path("users")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_users(users.clone()))
        .and_then(create_user);

    let routes = health
        .or(get_users_route)
        .or(get_user_route)
        .or(create_user_route);

    println!("Server running on http://0.0.0.0:3030");
    warp::serve(routes).run(([0, 0, 0, 0], 3030)).await;
}
```

### Actix-web Framework
```rust
use actix_web::{
    web, App, HttpResponse, HttpServer, Result, middleware::Logger,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Debug, Deserialize, Serialize, Clone)]
struct User {
    id: u32,
    name: String,
    email: String,
}

#[derive(Debug, Deserialize)]
struct CreateUser {
    name: String,
    email: String,
}

struct AppState {
    users: Mutex<HashMap<u32, User>>,
}

async fn health() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json("OK"))
}

async fn get_users(data: web::Data<AppState>) -> Result<HttpResponse> {
    let users = data.users.lock().unwrap();
    let users_vec: Vec<User> = users.values().cloned().collect();
    Ok(HttpResponse::Ok().json(users_vec))
}

async fn get_user(
    path: web::Path<u32>,
    data: web::Data<AppState>
) -> Result<HttpResponse> {
    let user_id = path.into_inner();
    let users = data.users.lock().unwrap();
    
    match users.get(&user_id) {
        Some(user) => Ok(HttpResponse::Ok().json(user)),
        None => Ok(HttpResponse::NotFound().json("User not found")),
    }
}

async fn create_user(
    user_data: web::Json<CreateUser>,
    data: web::Data<AppState>
) -> Result<HttpResponse> {
    let mut users = data.users.lock().unwrap();
    let id = users.len() as u32 + 1;
    
    let user = User {
        id,
        name: user_data.name.clone(),
        email: user_data.email.clone(),
    };
    
    users.insert(id, user.clone());
    Ok(HttpResponse::Created().json(user))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    
    let app_data = web::Data::new(AppState {
        users: Mutex::new(HashMap::new()),
    });

    println!("Server running on http://0.0.0.0:8080");

    HttpServer::new(move || {
        App::new()
            .app_data(app_data.clone())
            .wrap(Logger::default())
            .route("/health", web::get().to(health))
            .route("/users", web::get().to(get_users))
            .route("/users", web::post().to(create_user))
            .route("/users/{id}", web::get().to(get_user))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
```

## 🧪 Testing and Benchmarking

### Unit Testing
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_creation() {
        let user = User {
            id: 1,
            name: "John Doe".to_string(),
            email: "john@example.com".to_string(),
        };
        
        assert_eq!(user.id, 1);
        assert_eq!(user.name, "John Doe");
        assert_eq!(user.email, "john@example.com");
    }

    #[test]
    fn test_email_validation() {
        assert!(is_valid_email("test@example.com"));
        assert!(!is_valid_email("invalid-email"));
    }

    #[tokio::test]
    async fn test_async_function() {
        let result = async_function().await;
        assert!(result.is_ok());
    }
}
```

### Property-Based Testing
```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn test_string_reverse_twice_is_identity(s in ".*") {
        let reversed_twice: String = s.chars().rev().collect::<String>()
            .chars().rev().collect();
        prop_assert_eq!(s, reversed_twice);
    }

    #[test]
    fn test_addition_is_commutative(a in 0..1000i32, b in 0..1000i32) {
        prop_assert_eq!(a + b, b + a);
    }
}
```

### Benchmarking
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
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
```

## 🔧 Memory Safety and Performance

### Ownership and Borrowing
```rust
// Ownership transfer
fn take_ownership(s: String) {
    println!("Taking ownership of: {}", s);
}

// Borrowing (immutable reference)
fn borrow_string(s: &String) {
    println!("Borrowing: {}", s);
}

// Mutable borrowing
fn borrow_string_mut(s: &mut String) {
    s.push_str(" - modified");
}

fn main() {
    let mut my_string = String::from("Hello");
    
    borrow_string(&my_string);        // Immutable borrow
    borrow_string_mut(&mut my_string); // Mutable borrow
    take_ownership(my_string);         // Ownership transferred
    
    // my_string can't be used here anymore
}
```

### Smart Pointers
```rust
use std::rc::Rc;
use std::sync::Arc;
use std::cell::RefCell;
use std::sync::Mutex;

// Reference counting for single-threaded
fn use_rc() {
    let data = Rc::new(vec![1, 2, 3]);
    let data2 = Rc::clone(&data);
    let data3 = Rc::clone(&data);
    
    println!("Reference count: {}", Rc::strong_count(&data));
}

// Atomic reference counting for multi-threaded
fn use_arc() {
    let data = Arc::new(vec![1, 2, 3]);
    let data2 = Arc::clone(&data);
    
    std::thread::spawn(move || {
        println!("Data in thread: {:?}", data2);
    });
}

// Interior mutability
fn use_refcell() {
    let data = RefCell::new(vec![1, 2, 3]);
    data.borrow_mut().push(4);
    println!("Data: {:?}", data.borrow());
}

// Thread-safe interior mutability
fn use_mutex() {
    let data = Arc::new(Mutex::new(vec![1, 2, 3]));
    let data2 = Arc::clone(&data);
    
    std::thread::spawn(move || {
        let mut guard = data2.lock().unwrap();
        guard.push(4);
    });
}
```

### Error Handling
```rust
use thiserror::Error;
use anyhow::{Result, Context};

#[derive(Error, Debug)]
pub enum MyError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Parse error: {message}")]
    Parse { message: String },
    
    #[error("Network error: {0}")]
    Network(String),
}

// Using Result<T, E>
fn divide(a: f64, b: f64) -> Result<f64, MyError> {
    if b == 0.0 {
        Err(MyError::Parse {
            message: "Division by zero".to_string(),
        })
    } else {
        Ok(a / b)
    }
}

// Using anyhow for application errors
fn read_config() -> Result<Config> {
    let contents = std::fs::read_to_string("config.toml")
        .context("Failed to read config file")?;
    
    let config: Config = toml::from_str(&contents)
        .context("Failed to parse config")?;
    
    Ok(config)
}

// Pattern matching on Results
fn handle_result() {
    match divide(10.0, 2.0) {
        Ok(result) => println!("Result: {}", result),
        Err(MyError::Parse { message }) => {
            eprintln!("Parse error: {}", message);
        }
        Err(e) => eprintln!("Other error: {}", e),
    }
}
```

## 🚀 Async Programming with Tokio

### Basic Async/Await
```rust
use tokio::time::{sleep, Duration};

async fn async_task(id: u32) -> Result<String, Box<dyn std::error::Error>> {
    println!("Task {} starting", id);
    sleep(Duration::from_millis(100)).await;
    println!("Task {} completed", id);
    Ok(format!("Result from task {}", id))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Sequential execution
    let result1 = async_task(1).await?;
    let result2 = async_task(2).await?;
    
    // Concurrent execution
    let (result3, result4) = tokio::join!(
        async_task(3),
        async_task(4)
    );
    
    // Parallel execution with multiple tasks
    let tasks: Vec<_> = (5..=8)
        .map(|id| tokio::spawn(async_task(id)))
        .collect();
    
    for task in tasks {
        let result = task.await??;
        println!("Got: {}", result);
    }
    
    Ok(())
}
```

### Channels and Communication
```rust
use tokio::sync::{mpsc, oneshot};

async fn producer(mut tx: mpsc::Sender<i32>) {
    for i in 0..10 {
        if let Err(_) = tx.send(i).await {
            println!("Receiver dropped");
            return;
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
}

async fn consumer(mut rx: mpsc::Receiver<i32>) {
    while let Some(value) = rx.recv().await {
        println!("Received: {}", value);
    }
}

#[tokio::main]
async fn main() {
    let (tx, rx) = mpsc::channel(32);
    
    let producer_handle = tokio::spawn(producer(tx));
    let consumer_handle = tokio::spawn(consumer(rx));
    
    let _ = tokio::join!(producer_handle, consumer_handle);
}
```

## 📚 Best Practices

### Code Organization
- Use modules to organize related functionality
- Keep functions small and focused
- Use descriptive names for types and functions  
- Implement appropriate traits (Debug, Clone, etc.)
- Use `#[derive]` macros when possible
- Document public APIs with doc comments

### Performance Tips
- Use `Vec` over `LinkedList` in most cases
- Pre-allocate collections when size is known
- Use `String` for owned data, `&str` for borrowed
- Prefer iterators over index-based loops
- Use `Cow<str>` for conditional ownership
- Profile with `cargo flamegraph` or `perf`

### Memory Management
- Understand ownership, borrowing, and lifetimes
- Use `Rc/Arc` for shared ownership
- Use `RefCell/Mutex` for interior mutability
- Avoid unnecessary cloning
- Use `Box` for heap allocation when needed
- Consider `Pin` for self-referential structs

### Error Handling
- Use `Result<T, E>` for recoverable errors
- Use `panic!` only for unrecoverable errors
- Create custom error types with `thiserror`
- Use `anyhow` for application-level error handling
- Provide context with error messages
- Handle errors at appropriate levels

## 🔗 Useful Resources

- [The Rust Programming Language](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [The Rustonomicon](https://doc.rust-lang.org/nomicon/)
- [Async Book](https://rust-lang.github.io/async-book/)
- [Cargo Book](https://doc.rust-lang.org/cargo/)

---

*Memory safe, blazingly fast Rust development! 🦀*