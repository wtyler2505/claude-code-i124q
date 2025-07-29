# Actix-web Framework

Build high-performance web applications using Actix-web's actor-based architecture and robust middleware system.

## Purpose

This command helps you create scalable web applications using Actix-web, focusing on the actor model, middleware composition, and high-performance async handling.

## Usage

```
/actix $ARGUMENTS
```

## What this command does

1. **Creates Actix-web applications** with actor-based architecture
2. **Generates route handlers** with extractors and responses
3. **Implements middleware** for authentication, logging, and CORS
4. **Sets up async servers** with proper configuration
5. **Provides testing utilities** for HTTP endpoints

## Example Commands

### Basic Server Setup
```rust
use actix_web::{
    web, App, HttpResponse, HttpServer, Result, middleware::Logger,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

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

struct AppState {
    users: Mutex<HashMap<u32, User>>,
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
            .wrap(actix_cors::Cors::permissive())
            .service(
                web::scope("/api/v1")
                    .route("/health", web::get().to(health))
                    .route("/users", web::get().to(get_users))
                    .route("/users", web::post().to(create_user))
                    .route("/users/{id}", web::get().to(get_user))
                    .route("/users/{id}", web::put().to(update_user))
                    .route("/users/{id}", web::delete().to(delete_user))
            )
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}

async fn health() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now()
    })))
}
```

### Route Handlers
```rust
use actix_web::{web, HttpResponse, Result};

async fn get_users(
    query: web::Query<UserQuery>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let users = data.users.lock().unwrap();
    let mut user_list: Vec<User> = users.values().cloned().collect();
    
    // Apply pagination
    let offset = query.offset.unwrap_or(0) as usize;
    let limit = query.limit.unwrap_or(10) as usize;
    
    if offset < user_list.len() {
        let end = std::cmp::min(offset + limit, user_list.len());
        user_list.truncate(end);
        user_list.drain(..offset);
    } else {
        user_list.clear();
    }
    
    Ok(HttpResponse::Ok().json(user_list))
}

async fn get_user(
    path: web::Path<u32>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let user_id = path.into_inner();
    let users = data.users.lock().unwrap();
    
    match users.get(&user_id) {
        Some(user) => Ok(HttpResponse::Ok().json(user)),
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "User not found"
        }))),
    }
}

async fn create_user(
    user_data: web::Json<CreateUserRequest>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    if user_data.name.is_empty() || user_data.email.is_empty() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Name and email are required"
        })));
    }
    
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

async fn update_user(
    path: web::Path<u32>,
    user_data: web::Json<CreateUserRequest>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let user_id = path.into_inner();
    let mut users = data.users.lock().unwrap();
    
    match users.get_mut(&user_id) {
        Some(user) => {
            user.name = user_data.name.clone();
            user.email = user_data.email.clone();
            Ok(HttpResponse::Ok().json(user.clone()))
        }
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "User not found"
        }))),
    }
}

async fn delete_user(
    path: web::Path<u32>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let user_id = path.into_inner();
    let mut users = data.users.lock().unwrap();
    
    match users.remove(&user_id) {
        Some(_) => Ok(HttpResponse::NoContent().finish()),
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "User not found"
        }))),
    }
}
```

### Error Handling
```rust
use actix_web::{ResponseError, HttpResponse, Result};
use derive_more::{Display, Error};

#[derive(Debug, Display, Error)]
pub enum AppError {
    #[display(fmt = "User not found")]
    UserNotFound,
    
    #[display(fmt = "Invalid input: {}", message)]
    InvalidInput { message: String },
    
    #[display(fmt = "Database error: {}", _0)]
    Database(sqlx::Error),
    
    #[display(fmt = "Internal server error")]
    InternalError,
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        match self {
            AppError::UserNotFound => {
                HttpResponse::NotFound().json(serde_json::json!({
                    "error": "User not found",
                    "code": "USER_NOT_FOUND"
                }))
            }
            AppError::InvalidInput { message } => {
                HttpResponse::BadRequest().json(serde_json::json!({
                    "error": message,
                    "code": "INVALID_INPUT"
                }))
            }
            AppError::Database(_) => {
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Database error occurred",
                    "code": "DATABASE_ERROR"
                }))
            }
            AppError::InternalError => {
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Internal server error",
                    "code": "INTERNAL_ERROR"
                }))
            }
        }
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::Database(err)
    }
}

// Updated handler with error handling
async fn get_user_safe(
    path: web::Path<u32>,
    data: web::Data<AppState>,
) -> Result<HttpResponse, AppError> {
    let user_id = path.into_inner();
    let users = data.users.lock().unwrap();
    
    users.get(&user_id)
        .cloned()
        .map(|user| HttpResponse::Ok().json(user))
        .ok_or(AppError::UserNotFound)
}
```

### Middleware
```rust
use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage,
};
use futures::future::{Ready, LocalBoxFuture};
use std::{
    future::{ready, Ready},
    rc::Rc,
    time::Instant,
};

// Timing middleware
pub struct Timing;

impl<S, B> Transform<S, ServiceRequest> for Timing
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = TimingMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(TimingMiddleware { service }))
    }
}

pub struct TimingMiddleware<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for TimingMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let start = Instant::now();
        let fut = self.service.call(req);

        Box::pin(async move {
            let res = fut.await?;
            let elapsed = start.elapsed();
            println!("Request processed in {:?}", elapsed);
            Ok(res)
        })
    }
}

// Authentication middleware
use actix_web::http::header;

pub struct Auth;

impl<S, B> Transform<S, ServiceRequest> for Auth
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = AuthMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddleware { service }))
    }
}

pub struct AuthMiddleware<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for AuthMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let auth_header = req.headers().get(header::AUTHORIZATION);
        
        match auth_header {
            Some(header_value) => {
                if let Ok(auth_str) = header_value.to_str() {
                    if validate_token(auth_str) {
                        let fut = self.service.call(req);
                        return Box::pin(async move { fut.await });
                    }
                }
                Box::pin(async {
                    Ok(req.into_response(
                        HttpResponse::Unauthorized()
                            .json(serde_json::json!({"error": "Invalid token"}))
                            .into_body()
                    ))
                })
            }
            None => Box::pin(async {
                Ok(req.into_response(
                    HttpResponse::Unauthorized()
                        .json(serde_json::json!({"error": "Authorization header missing"}))
                        .into_body()
                ))
            }),
        }
    }
}

fn validate_token(token: &str) -> bool {
    // Implement your token validation logic
    token.starts_with("Bearer ")
}
```

### Database Integration
```rust
use actix_web::{web, App, HttpServer, Result};
use sqlx::{postgres::PgPoolOptions, PgPool};

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
struct User {
    id: i32,
    name: String,
    email: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

struct AppState {
    db: PgPool,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");
    
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");
    
    let app_data = web::Data::new(AppState { db: pool });
    
    HttpServer::new(move || {
        App::new()
            .app_data(app_data.clone())
            .wrap(actix_web::middleware::Logger::default())
            .service(
                web::scope("/api/v1")
                    .route("/users", web::get().to(get_users_from_db))
                    .route("/users", web::post().to(create_user_in_db))
                    .route("/users/{id}", web::get().to(get_user_from_db))
            )
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}

async fn get_users_from_db(data: web::Data<AppState>) -> Result<HttpResponse, AppError> {
    let users = sqlx::query_as::<_, User>(
        "SELECT id, name, email, created_at FROM users ORDER BY id"
    )
    .fetch_all(&data.db)
    .await?;
    
    Ok(HttpResponse::Ok().json(users))
}

async fn create_user_in_db(
    user_data: web::Json<CreateUserRequest>,
    data: web::Data<AppState>,
) -> Result<HttpResponse, AppError> {
    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at"
    )
    .bind(&user_data.name)
    .bind(&user_data.email)
    .fetch_one(&data.db)
    .await?;
    
    Ok(HttpResponse::Created().json(user))
}

async fn get_user_from_db(
    path: web::Path<i32>,
    data: web::Data<AppState>,
) -> Result<HttpResponse, AppError> {
    let user_id = path.into_inner();
    
    let user = sqlx::query_as::<_, User>(
        "SELECT id, name, email, created_at FROM users WHERE id = $1"
    )
    .bind(user_id)
    .fetch_optional(&data.db)
    .await?
    .ok_or(AppError::UserNotFound)?;
    
    Ok(HttpResponse::Ok().json(user))
}
```

### WebSocket Support
```rust
use actix::{Actor, StreamHandler, Handler, Message as ActixMessage};
use actix_web::{web, HttpRequest, HttpResponse, Error};
use actix_web_actors::ws;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ChatMessage {
    user: String,
    message: String,
    timestamp: chrono::DateTime<chrono::Utc>,
}

// WebSocket actor
struct WebSocketActor {
    id: String,
    chat_server: Arc<Mutex<HashMap<String, actix::Addr<WebSocketActor>>>>,
}

impl WebSocketActor {
    fn new(chat_server: Arc<Mutex<HashMap<String, actix::Addr<WebSocketActor>>>>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            chat_server,
        }
    }
}

impl Actor for WebSocketActor {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        let addr = ctx.address();
        self.chat_server.lock().unwrap().insert(self.id.clone(), addr);
        println!("WebSocket connection established: {}", self.id);
    }

    fn stopped(&mut self, _: &mut Self::Context) {
        self.chat_server.lock().unwrap().remove(&self.id);
        println!("WebSocket connection closed: {}", self.id);
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WebSocketActor {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Ping(msg)) => ctx.pong(&msg),
            Ok(ws::Message::Text(text)) => {
                let chat_message = ChatMessage {
                    user: self.id.clone(),
                    message: text.to_string(),
                    timestamp: chrono::Utc::now(),
                };
                
                // Broadcast to all connected clients
                let servers = self.chat_server.lock().unwrap();
                for (_, addr) in servers.iter() {
                    addr.do_send(BroadcastMessage(chat_message.clone()));
                }
            }
            Ok(ws::Message::Binary(bin)) => ctx.binary(bin),
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            }
            _ => (),
        }
    }
}

// Message for broadcasting
#[derive(ActixMessage)]
#[rtype(result = "()")]
struct BroadcastMessage(ChatMessage);

impl Handler<BroadcastMessage> for WebSocketActor {
    type Result = ();

    fn handle(&mut self, msg: BroadcastMessage, ctx: &mut Self::Context) {
        if let Ok(json) = serde_json::to_string(&msg.0) {
            ctx.text(json);
        }
    }
}

// WebSocket endpoint
async fn websocket_handler(
    req: HttpRequest,
    stream: web::Payload,
    data: web::Data<AppState>,
) -> Result<HttpResponse, Error> {
    let resp = ws::start(
        WebSocketActor::new(data.chat_server.clone()),
        &req,
        stream,
    );
    println!("WebSocket handshake completed");
    resp
}

// Updated AppState to include chat server
struct AppState {
    db: PgPool,
    chat_server: Arc<Mutex<HashMap<String, actix::Addr<WebSocketActor>>>>,
}

// Add WebSocket route to your app
HttpServer::new(move || {
    App::new()
        .app_data(app_data.clone())
        .route("/ws", web::get().to(websocket_handler))
        // ... other routes
})
```

### File Upload
```rust
use actix_multipart::Multipart;
use actix_web::{web, HttpResponse, Error};
use futures::{StreamExt, TryStreamExt};
use std::io::Write;
use tokio::fs;

async fn upload_file(
    mut payload: Multipart,
    data: web::Data<AppState>,
) -> Result<HttpResponse, Error> {
    let mut files = Vec::new();
    
    while let Ok(Some(mut field)) = payload.try_next().await {
        let content_type = field.content_disposition();
        
        if let Some(filename) = content_type.get_filename() {
            let filepath = format!("./uploads/{}", sanitize_filename::sanitize(&filename));
            
            // Create uploads directory if it doesn't exist
            fs::create_dir_all("./uploads").await?;
            
            let mut file = fs::File::create(&filepath).await?;
            
            // Stream file contents
            while let Some(chunk) = field.next().await {
                let data = chunk?;
                file.write_all(&data).await?;
            }
            
            files.push(serde_json::json!({
                "filename": filename,
                "path": filepath,
                "size": fs::metadata(&filepath).await?.len()
            }));
        }
    }
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Files uploaded successfully",
        "files": files
    })))
}

// Add file upload route
.route("/upload", web::post().to(upload_file))
```

### Testing
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{test, App};

    #[actix_web::test]
    async fn test_health_endpoint() {
        let app = test::init_service(
            App::new().route("/health", web::get().to(health))
        ).await;
        
        let req = test::TestRequest::get()
            .uri("/health")
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["status"], "healthy");
    }

    #[actix_web::test]
    async fn test_create_user() {
        let app_data = web::Data::new(AppState {
            users: Mutex::new(HashMap::new()),
        });
        
        let app = test::init_service(
            App::new()
                .app_data(app_data)
                .route("/users", web::post().to(create_user))
        ).await;
        
        let user_data = CreateUserRequest {
            name: "John Doe".to_string(),
            email: "john@example.com".to_string(),
        };
        
        let req = test::TestRequest::post()
            .uri("/users")
            .set_json(&user_data)
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 201);
        
        let created_user: User = test::read_body_json(resp).await;
        assert_eq!(created_user.name, "John Doe");
        assert_eq!(created_user.email, "john@example.com");
    }

    #[actix_web::test]
    async fn test_get_nonexistent_user() {
        let app_data = web::Data::new(AppState {
            users: Mutex::new(HashMap::new()),
        });
        
        let app = test::init_service(
            App::new()
                .app_data(app_data)
                .route("/users/{id}", web::get().to(get_user))
        ).await;
        
        let req = test::TestRequest::get()
            .uri("/users/999")
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 404);
    }
}
```

### Configuration
```rust
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub workers: usize,
    pub keep_alive: u64,
    pub client_request_timeout: u64,
    pub tls: Option<TlsConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TlsConfig {
    pub cert_file: String,
    pub key_file: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub timeout: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
}

impl Config {
    pub fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Config {
            server: ServerConfig {
                host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
                port: env::var("PORT")
                    .unwrap_or_else(|_| "8080".to_string())
                    .parse()?,
                workers: env::var("WORKERS")
                    .unwrap_or_else(|_| "4".to_string())
                    .parse()?,
                keep_alive: env::var("KEEP_ALIVE")
                    .unwrap_or_else(|_| "75".to_string())
                    .parse()?,
                client_request_timeout: env::var("CLIENT_TIMEOUT")
                    .unwrap_or_else(|_| "5000".to_string())
                    .parse()?,
                tls: None, // Configure TLS if needed
            },
            database: DatabaseConfig {
                url: env::var("DATABASE_URL")?,
                max_connections: env::var("DATABASE_MAX_CONNECTIONS")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()?,
                timeout: env::var("DATABASE_TIMEOUT")
                    .unwrap_or_else(|_| "30".to_string())
                    .parse()?,
            },
        })
    }
}

// Use configuration in main
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config = Config::from_env().expect("Failed to load configuration");
    
    HttpServer::new(move || {
        App::new()
            // ... app configuration
    })
    .bind(format!("{}:{}", config.server.host, config.server.port))?
    .workers(config.server.workers)
    .keep_alive(std::time::Duration::from_secs(config.server.keep_alive))
    .client_request_timeout(config.server.client_request_timeout)
    .run()
    .await
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
│   └── timing.rs
├── models/
│   ├── mod.rs
│   └── user.rs
├── services/
│   ├── mod.rs
│   └── user_service.rs
└── actors/
    ├── mod.rs
    └── websocket.rs
```

### Performance Optimization
- Use appropriate number of workers
- Implement connection pooling for databases
- Use streaming for large file transfers
- Enable compression middleware
- Configure keep-alive properly

### Security
- Implement proper authentication and authorization
- Validate all inputs
- Use HTTPS in production
- Implement rate limiting
- Handle errors without exposing sensitive information

### Error Handling
- Use custom error types with ResponseError trait
- Provide meaningful error messages
- Log errors appropriately
- Handle different error scenarios gracefully

### Testing
- Write unit tests for handlers
- Use integration tests for full request flows
- Test middleware functionality
- Mock external dependencies
- Test WebSocket connections