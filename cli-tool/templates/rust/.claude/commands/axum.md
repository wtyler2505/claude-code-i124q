# Axum Web Framework

Build high-performance async web applications with Axum framework and tokio runtime.

## Purpose

This command helps you create robust web applications using Axum, focusing on type-safe routing, middleware, and async request handling.

## Usage

```
/axum $ARGUMENTS
```

## What this command does

1. **Creates Axum web applications** with proper structure
2. **Generates route handlers** with extractors and responses
3. **Implements middleware** for common functionalities
4. **Sets up async servers** with proper error handling
5. **Provides testing utilities** for HTTP endpoints

## Example Commands

### Basic Server Setup
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
use tower::ServiceBuilder;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct User {
    id: u32,
    name: String,
    email: String,
}

#[derive(Debug, Deserialize)]
struct CreateUserRequest {
    name: String,
    email: String,
}

#[derive(Debug, Deserialize)]
struct UserQuery {
    limit: Option<u32>,
    offset: Option<u32>,
}

type AppState = std::sync::Arc<tokio::sync::Mutex<HashMap<u32, User>>>;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();
    
    // Create shared state
    let state = AppState::default();
    
    // Build our application with routes
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health))
        .route("/users", get(get_users).post(create_user))
        .route("/users/:id", get(get_user).put(update_user).delete(delete_user))
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CorsLayer::permissive())
        )
        .with_state(state);
    
    // Start server
    let listener = TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Server running on http://0.0.0.0:3000");
    
    axum::serve(listener, app).await.unwrap();
}

async fn root() -> &'static str {
    "Hello, Axum!"
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}
```

### Route Handlers
```rust
async fn get_users(
    Query(params): Query<UserQuery>,
    State(state): State<AppState>,
) -> Result<Json<Vec<User>>, StatusCode> {
    let users = state.lock().await;
    let mut user_list: Vec<User> = users.values().cloned().collect();
    
    // Apply pagination
    let offset = params.offset.unwrap_or(0) as usize;
    let limit = params.limit.unwrap_or(10) as usize;
    
    if offset >= user_list.len() {
        return Ok(Json(vec![]));
    }
    
    let end = std::cmp::min(offset + limit, user_list.len());
    user_list.truncate(end);
    user_list.drain(..offset);
    
    Ok(Json(user_list))
}

async fn get_user(
    Path(id): Path<u32>,
    State(state): State<AppState>,
) -> Result<Json<User>, StatusCode> {
    let users = state.lock().await;
    
    match users.get(&id) {
        Some(user) => Ok(Json(user.clone())),
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn create_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<(StatusCode, Json<User>), StatusCode> {
    // Validate input
    if payload.name.is_empty() || payload.email.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    
    let mut users = state.lock().await;
    let id = users.len() as u32 + 1;
    
    let user = User {
        id,
        name: payload.name,
        email: payload.email,
    };
    
    users.insert(id, user.clone());
    Ok((StatusCode::CREATED, Json(user)))
}

async fn update_user(
    Path(id): Path<u32>,
    State(state): State<AppState>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<User>, StatusCode> {
    let mut users = state.lock().await;
    
    match users.get_mut(&id) {
        Some(user) => {
            user.name = payload.name;
            user.email = payload.email;
            Ok(Json(user.clone()))
        }
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn delete_user(
    Path(id): Path<u32>,
    State(state): State<AppState>,
) -> Result<StatusCode, StatusCode> {
    let mut users = state.lock().await;
    
    match users.remove(&id) {
        Some(_) => Ok(StatusCode::NO_CONTENT),
        None => Err(StatusCode::NOT_FOUND),
    }
}
```

### Error Handling
```rust
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("User not found")]
    UserNotFound,
    
    #[error("Invalid input: {0}")]
    InvalidInput(String),
    
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Internal server error")]
    Internal,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::UserNotFound => (StatusCode::NOT_FOUND, "User not found"),
            AppError::InvalidInput(msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
            AppError::Internal => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"),
        };
        
        let body = Json(json!({
            "error": error_message,
            "status": status.as_u16()
        }));
        
        (status, body).into_response()
    }
}

// Updated handler with error handling
async fn get_user_safe(
    Path(id): Path<u32>,
    State(state): State<AppState>,
) -> Result<Json<User>, AppError> {
    let users = state.lock().await;
    
    users.get(&id)
        .cloned()
        .map(Json)
        .ok_or(AppError::UserNotFound)
}
```

### Middleware
```rust
use axum::{
    extract::Request,
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use std::time::Instant;

// Timing middleware
pub async fn timing_middleware(request: Request, next: Next) -> Response {
    let start = Instant::now();
    let response = next.run(request).await;
    let elapsed = start.elapsed();
    
    println!("Request processed in {:?}", elapsed);
    response
}

// Authentication middleware
pub async fn auth_middleware(
    headers: HeaderMap,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = headers.get("authorization")
        .and_then(|header| header.to_str().ok());
    
    match auth_header {
        Some(token) if validate_token(token) => {
            Ok(next.run(request).await)
        }
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}

// Logging middleware
pub async fn logging_middleware(request: Request, next: Next) -> Response {
    let method = request.method().clone();
    let uri = request.uri().clone();
    
    println!("Incoming {} request to {}", method, uri);
    
    let response = next.run(request).await;
    
    println!("Response status: {}", response.status());
    response
}

fn validate_token(token: &str) -> bool {
    // Implement your token validation logic
    token.starts_with("Bearer ")
}

// Apply middleware to routes
let protected_routes = Router::new()
    .route("/admin", get(admin_handler))
    .layer(middleware::from_fn(auth_middleware));

let app = Router::new()
    .route("/", get(root))
    .merge(protected_routes)
    .layer(middleware::from_fn(timing_middleware))
    .layer(middleware::from_fn(logging_middleware));
```

### Database Integration
```rust
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use sqlx::{postgres::PgPoolOptions, PgPool};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
struct User {
    id: i32,
    name: String,
    email: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
struct CreateUserRequest {
    name: String,
    email: String,
}

type DatabasePool = PgPool;

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    // Database connection
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await?;
    
    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;
    
    let app = Router::new()
        .route("/users", get(get_users).post(create_user))
        .route("/users/:id", get(get_user))
        .with_state(pool);
    
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
    
    Ok(())
}

async fn get_users(State(pool): State<DatabasePool>) -> Result<Json<Vec<User>>, AppError> {
    let users = sqlx::query_as::<_, User>("SELECT id, name, email, created_at FROM users")
        .fetch_all(&pool)
        .await?;
    
    Ok(Json(users))
}

async fn get_user(
    Path(id): Path<i32>,
    State(pool): State<DatabasePool>,
) -> Result<Json<User>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, name, email, created_at FROM users WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or(AppError::UserNotFound)?;
    
    Ok(Json(user))
}

async fn create_user(
    State(pool): State<DatabasePool>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<(StatusCode, Json<User>), AppError> {
    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at"
    )
    .bind(&payload.name)
    .bind(&payload.email)
    .fetch_one(&pool)
    .await?;
    
    Ok((StatusCode::CREATED, Json(user)))
}
```

### WebSocket Support
```rust
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::Response,
    routing::get,
    Router,
};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, Mutex};

type Clients = Arc<Mutex<HashMap<String, broadcast::Sender<String>>>>;

#[tokio::main]
async fn main() {
    let clients: Clients = Arc::new(Mutex::new(HashMap::new()));
    
    let app = Router::new()
        .route("/ws", get(websocket_handler))
        .route("/broadcast/:message", get(broadcast_message))
        .with_state(clients);
    
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(clients): State<Clients>,
) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, clients))
}

async fn handle_socket(socket: WebSocket, clients: Clients) {
    let (mut sender, mut receiver) = socket.split();
    let client_id = uuid::Uuid::new_v4().to_string();
    
    // Create broadcast channel for this client
    let (tx, mut rx) = broadcast::channel(100);
    
    // Add client to clients map
    clients.lock().await.insert(client_id.clone(), tx.clone());
    
    // Spawn task to send messages to client
    let send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });
    
    // Handle incoming messages
    while let Some(Ok(message)) = receiver.next().await {
        if let Message::Text(text) = message {
            println!("Received from {}: {}", client_id, text);
            
            // Echo message back
            if tx.send(format!("Echo: {}", text)).is_err() {
                break;
            }
        }
    }
    
    // Cleanup
    clients.lock().await.remove(&client_id);
    send_task.abort();
}

async fn broadcast_message(
    Path(message): Path<String>,
    State(clients): State<Clients>,
) -> &'static str {
    let clients = clients.lock().await;
    
    for (_, sender) in clients.iter() {
        let _ = sender.send(message.clone());
    }
    
    "Message broadcasted"
}
```

### Testing
```rust
use axum::{
    body::Body,
    http::{Method, Request, StatusCode},
    Router,
};
use hyper::body::to_bytes;
use serde_json::{json, Value};
use tower::ServiceExt;

#[cfg(test)]
mod tests {
    use super::*;

    async fn create_test_app() -> Router {
        let state = AppState::default();
        
        Router::new()
            .route("/", get(root))
            .route("/users", get(get_users).post(create_user))
            .route("/users/:id", get(get_user))
            .with_state(state)
    }

    #[tokio::test]
    async fn test_root_endpoint() {
        let app = create_test_app().await;
        
        let response = app
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        let body = to_bytes(response.into_body()).await.unwrap();
        assert_eq!(&body[..], b"Hello, Axum!");
    }

    #[tokio::test]
    async fn test_create_user() {
        let app = create_test_app().await;
        
        let user_data = json!({
            "name": "John Doe",
            "email": "john@example.com"
        });
        
        let response = app
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/users")
                    .header("content-type", "application/json")
                    .body(Body::from(user_data.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        
        assert_eq!(response.status(), StatusCode::CREATED);
        
        let body = to_bytes(response.into_body()).await.unwrap();
        let user: Value = serde_json::from_slice(&body).unwrap();
        
        assert_eq!(user["name"], "John Doe");
        assert_eq!(user["email"], "john@example.com");
    }

    #[tokio::test]
    async fn test_get_nonexistent_user() {
        let app = create_test_app().await;
        
        let response = app
            .oneshot(Request::builder().uri("/users/999").body(Body::empty()).unwrap())
            .await
            .unwrap();
        
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }
}
```

### Configuration Management
```rust
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub cors: CorsConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub workers: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CorsConfig {
    pub allowed_origins: Vec<String>,
    pub allowed_methods: Vec<String>,
}

impl Config {
    pub fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Config {
            server: ServerConfig {
                host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
                port: env::var("PORT")
                    .unwrap_or_else(|_| "3000".to_string())
                    .parse()?,
                workers: env::var("WORKERS")
                    .unwrap_or_else(|_| "4".to_string())
                    .parse()?,
            },
            database: DatabaseConfig {
                url: env::var("DATABASE_URL")?,
                max_connections: env::var("DATABASE_MAX_CONNECTIONS")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()?,
            },
            cors: CorsConfig {
                allowed_origins: env::var("CORS_ALLOWED_ORIGINS")
                    .unwrap_or_else(|_| "*".to_string())
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
                allowed_methods: vec![
                    "GET".to_string(),
                    "POST".to_string(),
                    "PUT".to_string(),
                    "DELETE".to_string(),
                ],
            },
        })
    }
}
```

## Best Practices

### Project Structure
```
src/
├── main.rs
├── config.rs
├── error.rs
├── handlers/
│   ├── mod.rs
│   ├── users.rs
│   └── auth.rs
├── middleware/
│   ├── mod.rs
│   ├── auth.rs
│   └── logging.rs
├── models/
│   ├── mod.rs
│   └── user.rs
├── services/
│   ├── mod.rs
│   └── user_service.rs
└── utils/
    └── mod.rs
```

### Performance Optimization
- Use `Arc<RwLock<T>>` for read-heavy shared state
- Implement connection pooling for databases
- Use streaming for large responses
- Enable compression middleware
- Use async/await properly to avoid blocking

### Security Considerations
- Implement proper authentication and authorization
- Validate all inputs
- Use HTTPS in production
- Implement rate limiting
- Handle errors gracefully without exposing internals

### Testing Strategy
- Write unit tests for handlers
- Use integration tests for full request flows
- Test error conditions
- Mock external dependencies
- Use property-based testing for complex logic