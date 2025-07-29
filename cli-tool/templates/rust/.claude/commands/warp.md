# Warp Web Framework

Build composable web applications using Warp's filter-based architecture and async capabilities.

## Purpose

This command helps you create modular web applications using Warp's unique filter composition system, focusing on type safety and performance.

## Usage

```
/warp $ARGUMENTS
```

## What this command does

1. **Creates Warp web applications** with filter composition
2. **Generates composable route filters** with extractors
3. **Implements middleware filters** for common functionalities
4. **Sets up async servers** with proper error handling
5. **Provides testing utilities** for filter testing

## Example Commands

### Basic Server Setup
```rust
use warp::{http::StatusCode, Filter};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

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

type Users = Arc<Mutex<HashMap<u32, User>>>;

#[tokio::main]
async fn main() {
    // Initialize shared state
    let users: Users = Arc::new(Mutex::new(HashMap::new()));
    
    // Define routes
    let routes = health_route()
        .or(user_routes(users.clone()))
        .with(warp::log("api"))
        .with(warp::cors().allow_any_origin());
    
    // Start server
    println!("Server starting on http://0.0.0.0:3030");
    warp::serve(routes)
        .run(([0, 0, 0, 0], 3030))
        .await;
}

fn health_route() -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path("health")
        .and(warp::get())
        .map(|| warp::reply::json(&serde_json::json!({
            "status": "healthy",
            "timestamp": chrono::Utc::now()
        })))
}
```

### Filter Composition
```rust
fn user_routes(users: Users) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    get_users(users.clone())
        .or(get_user(users.clone()))
        .or(create_user(users.clone()))
        .or(update_user(users.clone()))
        .or(delete_user(users))
}

fn get_users(users: Users) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path("users")
        .and(warp::get())
        .and(warp::query::<HashMap<String, String>>())
        .and(with_users(users))
        .and_then(handle_get_users)
}

fn get_user(users: Users) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path!("users" / u32)
        .and(warp::get())
        .and(with_users(users))
        .and_then(handle_get_user)
}

fn create_user(users: Users) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path("users")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_users(users))
        .and_then(handle_create_user)
}

fn update_user(users: Users) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path!("users" / u32)
        .and(warp::put())
        .and(warp::body::json())
        .and(with_users(users))
        .and_then(handle_update_user)
}

fn delete_user(users: Users) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path!("users" / u32)
        .and(warp::delete())
        .and(with_users(users))
        .and_then(handle_delete_user)
}

// Custom filter to inject users state
fn with_users(users: Users) -> impl Filter<Extract = (Users,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || users.clone())
}
```

### Handler Functions
```rust
async fn handle_get_users(
    query: HashMap<String, String>,
    users: Users,
) -> Result<impl warp::Reply, warp::Rejection> {
    let users_guard = users.lock().unwrap();
    let mut user_list: Vec<User> = users_guard.values().cloned().collect();
    
    // Apply pagination
    let limit: usize = query.get("limit")
        .and_then(|s| s.parse().ok())
        .unwrap_or(10);
    let offset: usize = query.get("offset")
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);
    
    if offset < user_list.len() {
        let end = std::cmp::min(offset + limit, user_list.len());
        user_list.truncate(end);
        user_list.drain(..offset);
    } else {
        user_list.clear();
    }
    
    Ok(warp::reply::json(&user_list))
}

async fn handle_get_user(
    id: u32,
    users: Users,
) -> Result<impl warp::Reply, warp::Rejection> {
    let users_guard = users.lock().unwrap();
    
    match users_guard.get(&id) {
        Some(user) => Ok(warp::reply::json(user)),
        None => Err(warp::reject::not_found()),
    }
}

async fn handle_create_user(
    request: CreateUserRequest,
    users: Users,
) -> Result<impl warp::Reply, warp::Rejection> {
    if request.name.is_empty() || request.email.is_empty() {
        return Err(warp::reject::custom(InvalidInput));
    }
    
    let mut users_guard = users.lock().unwrap();
    let id = users_guard.len() as u32 + 1;
    
    let user = User {
        id,
        name: request.name,
        email: request.email,
    };
    
    users_guard.insert(id, user.clone());
    
    Ok(warp::reply::with_status(
        warp::reply::json(&user),
        StatusCode::CREATED,
    ))
}

async fn handle_update_user(
    id: u32,
    request: CreateUserRequest,
    users: Users,
) -> Result<impl warp::Reply, warp::Rejection> {
    let mut users_guard = users.lock().unwrap();
    
    match users_guard.get_mut(&id) {
        Some(user) => {
            user.name = request.name;
            user.email = request.email;
            Ok(warp::reply::json(user))
        }
        None => Err(warp::reject::not_found()),
    }
}

async fn handle_delete_user(
    id: u32,
    users: Users,
) -> Result<impl warp::Reply, warp::Rejection> {
    let mut users_guard = users.lock().unwrap();
    
    match users_guard.remove(&id) {
        Some(_) => Ok(warp::reply::with_status(
            warp::reply(),
            StatusCode::NO_CONTENT,
        )),
        None => Err(warp::reject::not_found()),
    }
}
```

### Error Handling
```rust
use warp::{Rejection, Reply};
use serde::Serialize;

#[derive(Debug)]
struct InvalidInput;
impl warp::reject::Reject for InvalidInput {}

#[derive(Debug)]
struct DatabaseError;
impl warp::reject::Reject for DatabaseError {}

#[derive(Serialize)]
struct ErrorResponse {
    message: String,
    status: u16,
}

pub async fn handle_rejection(err: Rejection) -> Result<impl Reply, std::convert::Infallible> {
    let code;
    let message;

    if err.is_not_found() {
        code = StatusCode::NOT_FOUND;
        message = "Resource not found";
    } else if let Some(InvalidInput) = err.find::<InvalidInput>() {
        code = StatusCode::BAD_REQUEST;
        message = "Invalid input provided";
    } else if let Some(DatabaseError) = err.find::<DatabaseError>() {
        code = StatusCode::INTERNAL_SERVER_ERROR;
        message = "Database error occurred";
    } else if err.find::<warp::reject::MethodNotAllowed>().is_some() {
        code = StatusCode::METHOD_NOT_ALLOWED;
        message = "Method not allowed";
    } else if err.find::<warp::reject::PayloadTooLarge>().is_some() {
        code = StatusCode::PAYLOAD_TOO_LARGE;
        message = "Payload too large";
    } else {
        eprintln!("Unhandled rejection: {:?}", err);
        code = StatusCode::INTERNAL_SERVER_ERROR;
        message = "Internal server error";
    }

    let json = warp::reply::json(&ErrorResponse {
        message: message.into(),
        status: code.as_u16(),
    });

    Ok(warp::reply::with_status(json, code))
}

// Apply error handler to routes
let routes = user_routes(users.clone())
    .recover(handle_rejection);
```

### Middleware Filters
```rust
use std::time::Instant;
use uuid::Uuid;

// Logging middleware
fn with_logging() -> impl Filter<Extract = (), Error = std::convert::Infallible> + Copy {
    warp::log::custom(|info| {
        println!(
            "{} {} {} {:?} from {}",
            info.method(),
            info.path(),
            info.status().as_u16(),
            info.elapsed(),
            info.remote_addr().unwrap_or_else(|| ([0, 0, 0, 0], 0).into())
        );
    })
}

// Request ID middleware
fn with_request_id() -> impl Filter<Extract = (String,), Error = std::convert::Infallible> + Copy {
    warp::any()
        .map(|| Uuid::new_v4().to_string())
        .with(warp::reply::with::header("X-Request-ID", |id: &String| id.clone()))
}

// Timing middleware
fn with_timing() -> impl Filter<Extract = (), Error = std::convert::Infallible> + Copy {
    warp::any()
        .map(Instant::now)
        .untuple_one()
        .and_then(|start: Instant| async move {
            let elapsed = start.elapsed();
            println!("Request processed in {:?}", elapsed);
            Ok::<(), std::convert::Infallible>(())
        })
        .untuple_one()
}

// Authentication middleware
#[derive(Debug)]
struct Unauthorized;
impl warp::reject::Reject for Unauthorized {}

fn with_auth() -> impl Filter<Extract = (String,), Error = warp::Rejection> + Copy {
    warp::header::<String>("authorization")
        .and_then(|token: String| async move {
            if validate_token(&token) {
                Ok(token)
            } else {
                Err(warp::reject::custom(Unauthorized))
            }
        })
}

fn validate_token(token: &str) -> bool {
    // Implement your token validation logic
    token.starts_with("Bearer ")
}

// Rate limiting middleware
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::time::{Duration, SystemTime};

type RateLimitState = Arc<Mutex<HashMap<String, (u32, SystemTime)>>>;

fn with_rate_limit(
    max_requests: u32,
    window: Duration,
) -> impl Filter<Extract = (), Error = warp::Rejection> + Clone {
    let state: RateLimitState = Arc::new(Mutex::new(HashMap::new()));
    
    warp::addr::remote()
        .and(warp::any().map(move || state.clone()))
        .and_then(move |addr: Option<std::net::SocketAddr>, state: RateLimitState| async move {
            let client_ip = addr
                .map(|addr| addr.ip().to_string())
                .unwrap_or_else(|| "unknown".to_string());
            
            let mut limiter = state.lock().await;
            let now = SystemTime::now();
            
            let (count, last_reset) = limiter
                .entry(client_ip.clone())
                .or_insert((0, now));
            
            if now.duration_since(*last_reset).unwrap_or(Duration::ZERO) > window {
                *count = 0;
                *last_reset = now;
            }
            
            if *count >= max_requests {
                Err(warp::reject::custom(RateLimited))
            } else {
                *count += 1;
                Ok(())
            }
        })
        .untuple_one()
}

#[derive(Debug)]
struct RateLimited;
impl warp::reject::Reject for RateLimited {}

// Apply middleware to routes
let routes = user_routes(users.clone())
    .with(with_logging())
    .with(with_request_id())
    .with(with_rate_limit(100, Duration::from_secs(60)))
    .recover(handle_rejection);
```

### Database Integration
```rust
use sqlx::{postgres::PgPoolOptions, PgPool};

type DbPool = PgPool;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let database_url = std::env::var("DATABASE_URL")?;
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await?;
    
    sqlx::migrate!("./migrations").run(&pool).await?;
    
    let routes = user_routes_with_db(pool.clone())
        .with(warp::log("api"))
        .recover(handle_rejection);
    
    warp::serve(routes).run(([0, 0, 0, 0], 3030)).await;
    Ok(())
}

fn user_routes_with_db(
    pool: DbPool,
) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    get_users_from_db(pool.clone())
        .or(create_user_in_db(pool.clone()))
        .or(get_user_from_db(pool))
}

fn get_users_from_db(
    pool: DbPool,
) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path("users")
        .and(warp::get())
        .and(with_db(pool))
        .and_then(handle_get_users_from_db)
}

fn create_user_in_db(
    pool: DbPool,
) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path("users")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_db(pool))
        .and_then(handle_create_user_in_db)
}

fn get_user_from_db(
    pool: DbPool,
) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path!("users" / i32)
        .and(warp::get())
        .and(with_db(pool))
        .and_then(handle_get_user_from_db)
}

fn with_db(pool: DbPool) -> impl Filter<Extract = (DbPool,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || pool.clone())
}

async fn handle_get_users_from_db(pool: DbPool) -> Result<impl warp::Reply, warp::Rejection> {
    let users = sqlx::query_as!(
        User,
        "SELECT id, name, email FROM users ORDER BY id"
    )
    .fetch_all(&pool)
    .await
    .map_err(|_| warp::reject::custom(DatabaseError))?;
    
    Ok(warp::reply::json(&users))
}

async fn handle_create_user_in_db(
    request: CreateUserRequest,
    pool: DbPool,
) -> Result<impl warp::Reply, warp::Rejection> {
    let user = sqlx::query_as!(
        User,
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email",
        request.name,
        request.email
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| warp::reject::custom(DatabaseError))?;
    
    Ok(warp::reply::with_status(
        warp::reply::json(&user),
        StatusCode::CREATED,
    ))
}

async fn handle_get_user_from_db(
    id: i32,
    pool: DbPool,
) -> Result<impl warp::Reply, warp::Rejection> {
    let user = sqlx::query_as!(
        User,
        "SELECT id, name, email FROM users WHERE id = $1",
        id
    )
    .fetch_optional(&pool)
    .await
    .map_err(|_| warp::reject::custom(DatabaseError))?
    .ok_or_else(|| warp::reject::not_found())?;
    
    Ok(warp::reply::json(&user))
}
```

### WebSocket Support
```rust
use warp::ws::{Message, WebSocket};
use futures::{FutureExt, StreamExt};
use tokio::sync::broadcast;

fn websocket_route() -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path("ws")
        .and(warp::ws())
        .map(|ws: warp::ws::Ws| {
            ws.on_upgrade(handle_websocket)
        })
}

async fn handle_websocket(websocket: WebSocket) {
    let (tx, rx) = websocket.split();
    let (broadcast_tx, _) = broadcast::channel(100);
    
    // Handle incoming messages
    let broadcast_tx_clone = broadcast_tx.clone();
    let incoming = rx.for_each(move |message| {
        let broadcast_tx = broadcast_tx_clone.clone();
        async move {
            if let Ok(msg) = message {
                if let Ok(text) = msg.to_str() {
                    println!("Received: {}", text);
                    let _ = broadcast_tx.send(format!("Echo: {}", text));
                }
            }
        }
    });
    
    // Handle outgoing messages
    let mut broadcast_rx = broadcast_tx.subscribe();
    let outgoing = async move {
        while let Ok(msg) = broadcast_rx.recv().await {
            if tx.send(Message::text(msg)).await.is_err() {
                break;
            }
        }
    };
    
    // Run both incoming and outgoing message handlers
    futures::future::select(incoming.boxed(), outgoing.boxed()).await;
}

// Chat room example
use std::collections::HashMap;

type Clients = Arc<Mutex<HashMap<String, broadcast::Sender<String>>>>;

fn chat_routes(clients: Clients) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    websocket_chat(clients.clone())
        .or(broadcast_message(clients))
}

fn websocket_chat(clients: Clients) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path("chat")
        .and(warp::ws())
        .and(warp::any().map(move || clients.clone()))
        .map(|ws: warp::ws::Ws, clients: Clients| {
            ws.on_upgrade(move |socket| handle_chat_client(socket, clients))
        })
}

async fn handle_chat_client(websocket: WebSocket, clients: Clients) {
    let client_id = uuid::Uuid::new_v4().to_string();
    let (client_tx, mut client_rx) = broadcast::channel(100);
    
    // Add client to the clients map
    clients.lock().unwrap().insert(client_id.clone(), client_tx.clone());
    
    let (ws_tx, mut ws_rx) = websocket.split();
    
    // Forward messages from WebSocket to broadcast channel
    let clients_for_incoming = clients.clone();
    let incoming = async move {
        while let Some(result) = ws_rx.next().await {
            if let Ok(msg) = result {
                if let Ok(text) = msg.to_str() {
                    // Broadcast to all clients
                    let clients_guard = clients_for_incoming.lock().unwrap();
                    for (_, tx) in clients_guard.iter() {
                        let _ = tx.send(format!("{}: {}", client_id, text));
                    }
                }
            }
        }
    };
    
    // Forward messages from broadcast channel to WebSocket
    let outgoing = async move {
        while let Ok(msg) = client_rx.recv().await {
            if ws_tx.send(Message::text(msg)).await.is_err() {
                break;
            }
        }
    };
    
    // Run both tasks concurrently
    tokio::select! {
        _ = incoming => {},
        _ = outgoing => {},
    }
    
    // Cleanup: remove client from clients map
    clients.lock().unwrap().remove(&client_id);
}
```

### Testing
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use warp::test;

    #[tokio::test]
    async fn test_health_endpoint() {
        let filter = health_route();
        
        let resp = test::request()
            .method("GET")
            .path("/health")
            .reply(&filter)
            .await;
        
        assert_eq!(resp.status(), 200);
        
        let body: serde_json::Value = serde_json::from_slice(resp.body()).unwrap();
        assert_eq!(body["status"], "healthy");
    }

    #[tokio::test]
    async fn test_create_user() {
        let users = Arc::new(Mutex::new(HashMap::new()));
        let filter = create_user(users);
        
        let user_data = CreateUserRequest {
            name: "John Doe".to_string(),
            email: "john@example.com".to_string(),
        };
        
        let resp = test::request()
            .method("POST")
            .path("/users")
            .json(&user_data)
            .reply(&filter)
            .await;
        
        assert_eq!(resp.status(), 201);
        
        let created_user: User = serde_json::from_slice(resp.body()).unwrap();
        assert_eq!(created_user.name, "John Doe");
        assert_eq!(created_user.email, "john@example.com");
    }

    #[tokio::test]
    async fn test_get_nonexistent_user() {
        let users = Arc::new(Mutex::new(HashMap::new()));
        let filter = get_user(users).recover(handle_rejection);
        
        let resp = test::request()
            .method("GET")
            .path("/users/999")
            .reply(&filter)
            .await;
        
        assert_eq!(resp.status(), 404);
    }

    #[tokio::test]
    async fn test_rate_limiting() {
        let filter = warp::path("test")
            .and(warp::get())
            .and(with_rate_limit(2, Duration::from_secs(60)))
            .map(|| "OK")
            .recover(handle_rejection);
        
        // First two requests should succeed
        let resp1 = test::request()
            .method("GET")
            .path("/test")
            .reply(&filter)
            .await;
        assert_eq!(resp1.status(), 200);
        
        let resp2 = test::request()
            .method("GET")
            .path("/test")
            .reply(&filter)
            .await;
        assert_eq!(resp2.status(), 200);
        
        // Third request should be rate limited
        let resp3 = test::request()
            .method("GET")
            .path("/test")
            .reply(&filter)
            .await;
        assert_eq!(resp3.status(), 429); // Assuming rate limited returns 429
    }
}
```

## Best Practices

### Filter Composition
- Keep filters small and composable
- Use `and()` to combine filters
- Use `or()` for alternative routes
- Leverage type inference for cleaner code

### Error Handling
- Implement custom rejection types
- Use a centralized error handler
- Provide meaningful error messages
- Log errors appropriately

### Performance Optimization
- Use `Clone` filters efficiently
- Avoid unnecessary allocations in filters
- Use streaming for large responses
- Implement proper connection pooling

### Security
- Implement authentication and authorization filters
- Validate all inputs
- Use HTTPS in production
- Implement rate limiting
- Handle CORS properly

### Testing
- Test individual filters
- Use `warp::test` for integration testing
- Test error conditions
- Mock external dependencies