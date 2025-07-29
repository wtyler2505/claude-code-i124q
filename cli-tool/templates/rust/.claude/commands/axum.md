# Axum Web Framework

Build modern, fast, and ergonomic web applications with Axum and Tokio.

## Purpose

This command helps you create high-performance web services using Axum, a web framework built on top of Tokio, Tower, and Hyper.

## Usage

```
/axum $ARGUMENTS
```

## What this command does

1. **Creates Axum web applications** with modern async/await patterns
2. **Generates route handlers** with extractors and responses
3. **Sets up middleware** for common functionality
4. **Provides testing utilities** for web endpoints

## Example Commands

### Basic Axum Server
```rust
use axum::{
    extract::Query,
    http::StatusCode,
    response::{Html, Json},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::net::TcpListener;
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    trace::TraceLayer,
};

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::init();

    let app = create_app();

    let listener = TcpListener::bind("0.0.0.0:3000")
        .await
        .unwrap();
    
    println!("Server running on http://0.0.0.0:3000");
    axum::serve(listener, app).await.unwrap();
}

fn create_app() -> Router {
    Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/users", get(list_users).post(create_user))
        .route("/users/:id", get(get_user))
        .route("/api/data", get(get_data))
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CorsLayer::permissive())
        )
}

async fn root() -> Html<&'static str> {
    Html("<h1>Hello, Axum!</h1>")
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}
```

### Request Extractors
```rust
use axum::{
    extract::{Path, Query, State, Json as AxumJson},
    http::{HeaderMap, Method, Uri},
    response::Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Deserialize)]
struct QueryParams {
    page: Option<u32>,
    limit: Option<u32>,
    filter: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
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

// Shared application state
#[derive(Clone)]
struct AppState {
    users: Arc<tokio::sync::Mutex<Vec<User>>>,
}

// Path parameter extraction
async fn get_user(Path(user_id): Path<u32>) -> Result<Json<User>, StatusCode> {
    // Find user by ID
    Ok(Json(User {
        id: user_id,
        name: "John Doe".to_string(),
        email: "john@example.com".to_string(),
    }))
}

// Query parameter extraction
async fn list_users(
    Query(params): Query<QueryParams>,
    State(state): State<AppState>,
) -> Json<Vec<User>> {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(10);
    
    let users = state.users.lock().await;
    let start = ((page - 1) * limit) as usize;
    let end = (start + limit as usize).min(users.len());
    
    Json(users[start..end].to_vec())
}

// JSON body extraction
async fn create_user(
    State(state): State<AppState>,
    AxumJson(payload): AxumJson<CreateUserRequest>,
) -> Result<Json<User>, StatusCode> {
    let mut users = state.users.lock().await;
    let id = users.len() as u32 + 1;
    
    let user = User {
        id,
        name: payload.name,
        email: payload.email,
    };
    
    users.push(user.clone());
    Ok(Json(user))
}

// Header extraction
async fn get_headers(headers: HeaderMap) -> Json<HashMap<String, String>> {
    let mut header_map = HashMap::new();
    
    for (name, value) in headers.iter() {
        if let Ok(value_str) = value.to_str() {
            header_map.insert(name.to_string(), value_str.to_string());
        }
    }
    
    Json(header_map)
}

// Method and URI extraction
async fn request_info(method: Method, uri: Uri) -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "method": method.to_string(),
        "uri": uri.to_string(),
        "path": uri.path(),
        "query": uri.query()
    }))
}
```

### Custom Extractors
```rust
use axum::{
    async_trait,
    extract::{FromRequestParts, rejection::JsonRejection},
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use serde::de::DeserializeOwned;

// Custom JSON extractor with better error handling
pub struct CustomJson<T>(pub T);

#[async_trait]
impl<T, S> FromRequestParts<S> for CustomJson<T>
where
    T: DeserializeOwned,
    S: Send + Sync,
{
    type Rejection = CustomJsonRejection;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        match AxumJson::<T>::from_request_parts(parts, state).await {
            Ok(value) => Ok(Self(value.0)),
            Err(rejection) => Err(CustomJsonRejection::from(rejection)),
        }
    }
}

pub struct CustomJsonRejection {
    status: StatusCode,
    message: String,
}

impl From<JsonRejection> for CustomJsonRejection {
    fn from(rejection: JsonRejection) -> Self {
        Self {
            status: rejection.status(),
            message: rejection.body_text(),
        }
    }
}

impl IntoResponse for CustomJsonRejection {
    fn into_response(self) -> Response {
        let payload = serde_json::json!({
            "error": "Invalid JSON",
            "message": self.message
        });
        
        (self.status, Json(payload)).into_response()
    }
}

// Usage
async fn create_user_custom(
    CustomJson(payload): CustomJson<CreateUserRequest>,
) -> Result<Json<User>, StatusCode> {
    // Handle the request
    todo!()
}
```

### Middleware
```rust
use axum::{
    body::Body,
    extract::Request,
    http::{HeaderValue, Method},
    middleware::{self, Next},
    response::Response,
    Router,
};
use tower::ServiceBuilder;
use tower_http::{
    compression::CompressionLayer,
    cors::{Any, CorsLayer},
    limit::RequestBodyLimitLayer,
    timeout::TimeoutLayer,
    trace::TraceLayer,
};
use std::time::Duration;

fn create_app_with_middleware() -> Router {
    Router::new()
        .route("/api/users", get(list_users))
        .layer(
            ServiceBuilder::new()
                // Request timeout
                .layer(TimeoutLayer::new(Duration::from_secs(30)))
                // Request body size limit
                .layer(RequestBodyLimitLayer::new(1024 * 1024)) // 1MB
                // Compression
                .layer(CompressionLayer::new())
                // CORS
                .layer(
                    CorsLayer::new()
                        .allow_origin(Any)
                        .allow_methods([Method::GET, Method::POST])
                        .allow_headers(Any)
                )
                // Tracing
                .layer(TraceLayer::new_for_http())
                // Custom middleware
                .layer(middleware::from_fn(auth_middleware))
                .layer(middleware::from_fn(logging_middleware))
        )
}

// Authentication middleware
async fn auth_middleware(
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = request
        .headers()
        .get("authorization")
        .and_then(|header| header.to_str().ok());

    match auth_header {
        Some(header) if header.starts_with("Bearer ") => {
            // Validate token
            let token = &header[7..];
            if validate_token(token).await? {
                Ok(next.run(request).await)
            } else {
                Err(StatusCode::UNAUTHORIZED)
            }
        }
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}

// Logging middleware
async fn logging_middleware(
    request: Request,
    next: Next,
) -> Response {
    let method = request.method().clone();
    let uri = request.uri().clone();
    
    let start = std::time::Instant::now();
    let response = next.run(request).await;
    let duration = start.elapsed();
    
    tracing::info!(
        method = %method,
        uri = %uri,
        status = %response.status(),
        duration = ?duration,
        "Request completed"
    );
    
    response
}

async fn validate_token(token: &str) -> Result<bool, StatusCode> {
    // Implement token validation logic
    Ok(token == "valid-token")
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
use std::fmt;

// Custom error type
#[derive(Debug)]
pub enum AppError {
    NotFound,
    BadRequest(String),
    InternalServerError(String),
    Unauthorized,
    ValidationError(Vec<String>),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::NotFound => write!(f, "Resource not found"),
            AppError::BadRequest(msg) => write!(f, "Bad request: {}", msg),
            AppError::InternalServerError(msg) => write!(f, "Internal server error: {}", msg),
            AppError::Unauthorized => write!(f, "Unauthorized"),
            AppError::ValidationError(errors) => {
                write!(f, "Validation errors: {}", errors.join(", "))
            }
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::NotFound => (StatusCode::NOT_FOUND, "Resource not found"),
            AppError::BadRequest(_) => (StatusCode::BAD_REQUEST, "Bad request"),
            AppError::InternalServerError(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error")
            }
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            AppError::ValidationError(_) => (StatusCode::BAD_REQUEST, "Validation error"),
        };

        let body = Json(json!({
            "error": error_message,
            "details": self.to_string()
        }));

        (status, body).into_response()
    }
}

// Usage in handlers
async fn get_user_with_error(
    Path(user_id): Path<u32>,
) -> Result<Json<User>, AppError> {
    if user_id == 0 {
        return Err(AppError::BadRequest("User ID cannot be zero".to_string()));
    }

    // Simulate database lookup
    match find_user_by_id(user_id).await {
        Some(user) => Ok(Json(user)),
        None => Err(AppError::NotFound),
    }
}

async fn find_user_by_id(id: u32) -> Option<User> {
    // Simulate database lookup
    if id == 1 {
        Some(User {
            id,
            name: "John Doe".to_string(),
            email: "john@example.com".to_string(),
        })
    } else {
        None
    }
}
```

### Database Integration
```rust
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Postgres, Row};
use std::sync::Arc;

#[derive(Clone)]
struct AppState {
    db: Pool<Postgres>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
struct User {
    id: i32,
    name: String,
    email: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
struct CreateUser {
    name: String,
    email: String,
}

async fn create_user_db(
    State(state): State<AppState>,
    Json(payload): Json<CreateUser>,
) -> Result<Json<User>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *"
    )
    .bind(&payload.name)
    .bind(&payload.email)
    .fetch_one(&state.db)
    .await
    .map_err(|e| AppError::InternalServerError(e.to_string()))?;

    Ok(Json(user))
}

async fn get_user_db(
    Path(user_id): Path<i32>,
    State(state): State<AppState>,
) -> Result<Json<User>, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| AppError::InternalServerError(e.to_string()))?;

    match user {
        Some(user) => Ok(Json(user)),
        None => Err(AppError::NotFound),
    }
}

async fn list_users_db(
    State(state): State<AppState>,
) -> Result<Json<Vec<User>>, AppError> {
    let users = sqlx::query_as::<_, User>("SELECT * FROM users ORDER BY created_at DESC")
        .fetch_all(&state.db)
        .await
        .map_err(|e| AppError::InternalServerError(e.to_string()))?;

    Ok(Json(users))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Database connection
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(20)
        .connect(&database_url)
        .await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;

    let app_state = AppState { db: pool };

    let app = Router::new()
        .route("/users", get(list_users_db).post(create_user_db))
        .route("/users/:id", get(get_user_db))
        .with_state(app_state);

    let listener = TcpListener::bind("0.0.0.0:3000").await?;
    axum::serve(listener, app).await?;

    Ok(())
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
use std::sync::Arc;
use tokio::sync::broadcast;

#[derive(Clone)]
struct AppState {
    tx: broadcast::Sender<String>,
}

async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.tx.subscribe();

    // Task to receive messages from the WebSocket client
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(Message::Text(text))) = receiver.next().await {
            println!("Received: {}", text);
            
            // Broadcast message to all clients
            if state.tx.send(text).is_err() {
                break;
            }
        }
    });

    // Task to send messages to the WebSocket client
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender
                .send(Message::Text(msg))
                .await
                .is_err()
            {
                break;
            }
        }
    });

    // If any one of the tasks exit, abort the other
    tokio::select! {
        _ = (&mut send_task) => {
            recv_task.abort();
        },
        _ = (&mut recv_task) => {
            send_task.abort();
        },
    }
}

fn create_websocket_app() -> Router {
    let (tx, _rx) = broadcast::channel(100);
    let app_state = AppState { tx };

    Router::new()
        .route("/ws", get(websocket_handler))
        .with_state(app_state)
}
```

### Testing
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use serde_json::json;
    use tower::ServiceExt; // for `oneshot` and `ready`

    #[tokio::test]
    async fn test_health_check() {
        let app = create_app();

        let response = app
            .oneshot(Request::builder().uri("/health").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
        
        assert_eq!(json["status"], "healthy");
    }

    #[tokio::test]
    async fn test_create_user() {
        let app = create_app();

        let user_data = json!({
            "name": "John Doe",
            "email": "john@example.com"
        });

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/users")
                    .method("POST")
                    .header("content-type", "application/json")
                    .body(Body::from(user_data.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
        let user: User = serde_json::from_slice(&body).unwrap();
        
        assert_eq!(user.name, "John Doe");
        assert_eq!(user.email, "john@example.com");
    }
}
```

## Best Practices

### Performance Optimization
- Use `Arc` for shared state to avoid cloning
- Implement connection pooling for databases
- Use streaming for large responses
- Implement proper caching strategies
- Use compression middleware
- Monitor and limit request body sizes

### Security
- Validate all inputs using extractors
- Implement proper authentication and authorization
- Use HTTPS in production
- Set appropriate CORS policies
- Implement rate limiting
- Sanitize error messages to avoid information leakage

### Code Organization
- Separate handlers into modules
- Use shared state for database connections
- Implement custom extractors for common patterns
- Create reusable middleware
- Use proper error handling
- Write comprehensive tests

### Production Deployment  
- Use environment variables for configuration
- Implement health checks
- Add proper logging and metrics
- Use graceful shutdown
- Handle backpressure appropriately
- Monitor resource usage