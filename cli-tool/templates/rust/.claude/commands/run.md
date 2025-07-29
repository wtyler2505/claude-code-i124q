# Rust Run

Execute Rust applications with various runtime configurations and debugging options.

## Purpose

This command helps you run Rust applications efficiently with proper argument handling, environment configuration, and debugging capabilities.

## Usage

```
/run $ARGUMENTS
```

## What this command does

1. **Executes Rust binaries** with proper configuration
2. **Manages runtime arguments** and environment variables
3. **Provides debugging support** with backtrace and logging
4. **Handles different run modes** (development, release, profiling)

## Example Commands

### Basic Execution
```bash
# Run the default binary
cargo run

# Run with arguments
cargo run -- --help --config config.toml

# Run specific binary
cargo run --bin my-app

# Run with release optimizations
cargo run --release
```

### Development vs Release
```bash
# Development mode (default)
cargo run

# Release mode for performance
cargo run --release

# With debug symbols in release
cargo run --release --config 'profile.release.debug=true'

# Development with optimizations
cargo run --profile dev-opt
```

### Runtime Configuration
```bash
# Set environment variables
RUST_LOG=debug cargo run

# Enable backtraces
RUST_BACKTRACE=1 cargo run

# Full backtrace
RUST_BACKTRACE=full cargo run

# Combine multiple environment variables
RUST_LOG=debug RUST_BACKTRACE=1 cargo run
```

## Environment Variables

### Rust-specific Variables
```bash
# Logging configuration
export RUST_LOG=debug                    # Enable debug logging
export RUST_LOG=my_app=trace,hyper=info  # Per-crate logging levels
export RUST_LOG=warn                     # Only warnings and errors

# Backtrace configuration
export RUST_BACKTRACE=1                  # Enable backtrace
export RUST_BACKTRACE=full               # Full backtrace with symbols

# Memory allocator
export RUST_MIN_STACK=8388608            # Set minimum stack size
export RUST_MAX_STACK=16777216           # Set maximum stack size
```

### Application-specific Variables
```bash
# Configuration file
export CONFIG_PATH=/path/to/config.toml

# Database URL
export DATABASE_URL=postgres://localhost/mydb

# API keys
export API_KEY=your-secret-key

# Feature flags
export FEATURE_XYZ=enabled
```

## Debugging

### Basic Debugging
```bash
# Run with debug information
cargo run --bin my-app

# Run with verbose output
cargo run --verbose

# Run with backtrace
RUST_BACKTRACE=1 cargo run

# Run with full backtrace
RUST_BACKTRACE=full cargo run
```

### Using Debuggers
```bash
# Debug with GDB
cargo build
gdb target/debug/my-app

# Debug with LLDB
cargo build
lldb target/debug/my-app

# Debug with rust-gdb wrapper
cargo build
rust-gdb target/debug/my-app

# Debug with rust-lldb wrapper
cargo build
rust-lldb target/debug/my-app
```

### VS Code Debugging
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "lldb",
            "request": "launch",
            "name": "Debug my-app",
            "cargo": {
                "args": ["build", "--bin=my-app"],
                "filter": {
                    "name": "my-app",
                    "kind": "bin"
                }
            },
            "args": ["--config", "config.toml"],
            "cwd": "${workspaceFolder}",
            "env": {
                "RUST_LOG": "debug",
                "RUST_BACKTRACE": "1"
            }
        }
    ]
}
```

## Profiling

### CPU Profiling
```bash
# Install profiling tools
cargo install cargo-profiler

# Profile with perf
cargo profiler perf --bin my-app

# Profile with instruments (macOS)
cargo profiler instruments --bin my-app

# Profile with custom profiler
cargo profiler custom --bin my-app --profiler my-profiler
```

### Memory Profiling
```bash
# Install memory profiler
cargo install cargo-profiler

# Profile memory usage
cargo profiler memcheck --bin my-app

# Use valgrind for memory debugging
cargo build
valgrind --tool=memcheck target/debug/my-app

# Use heaptrack for heap profiling
cargo build
heaptrack target/debug/my-app
```

### Performance Monitoring
```bash
# Monitor performance with flamegraph
cargo install flamegraph

# Generate flamegraph
cargo flamegraph --bin my-app

# Generate flamegraph with specific duration
cargo flamegraph --bin my-app -- --duration 30
```

## Argument Handling

### Using clap for CLI Arguments
```rust
use clap::{Arg, Command};

fn main() {
    let matches = Command::new("my-app")
        .version("1.0")
        .author("Your Name <your.email@example.com>")
        .about("Description of my application")
        .arg(
            Arg::new("config")
                .short('c')
                .long("config")
                .value_name("FILE")
                .help("Sets a custom config file")
                .required(false)
        )
        .arg(
            Arg::new("verbose")
                .short('v')
                .long("verbose")
                .help("Enable verbose output")
                .action(clap::ArgAction::SetTrue)
        )
        .get_matches();

    let config_file = matches.get_one::<String>("config")
        .unwrap_or("config.toml");
    
    let verbose = matches.get_flag("verbose");
    
    println!("Config file: {}", config_file);
    println!("Verbose: {}", verbose);
}
```

### Complex Argument Handling
```rust
use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "my-app")]
#[command(about = "A CLI application")]
struct Cli {
    #[arg(short, long, value_name = "FILE")]
    config: Option<String>,
    
    #[arg(short, long, action = clap::ArgAction::Count)]
    verbose: u8,
    
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    Serve {
        #[arg(short, long, default_value = "8080")]
        port: u16,
    },
    Process {
        #[arg(short, long)]
        input: String,
        #[arg(short, long)]
        output: String,
    },
}

fn main() {
    let cli = Cli::parse();
    
    match &cli.command {
        Some(Commands::Serve { port }) => {
            println!("Starting server on port {}", port);
        }
        Some(Commands::Process { input, output }) => {
            println!("Processing {} -> {}", input, output);
        }
        None => {
            println!("No command specified");
        }
    }
}
```

## Configuration Management

### Loading Configuration
```rust
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
struct Config {
    server: ServerConfig,
    database: DatabaseConfig,
    logging: LoggingConfig,
}

#[derive(Debug, Serialize, Deserialize)]
struct ServerConfig {
    host: String,
    port: u16,
    workers: usize,
}

#[derive(Debug, Serialize, Deserialize)]
struct DatabaseConfig {
    url: String,
    max_connections: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct LoggingConfig {
    level: String,
    format: String,
}

fn load_config(path: &str) -> Result<Config, Box<dyn std::error::Error>> {
    let content = fs::read_to_string(path)?;
    let config: Config = toml::from_str(&content)?;
    Ok(config)
}

fn main() {
    let config = load_config("config.toml")
        .unwrap_or_else(|e| {
            eprintln!("Error loading config: {}", e);
            std::process::exit(1);
        });
    
    println!("Starting server on {}:{}", config.server.host, config.server.port);
}
```

### Environment-based Configuration
```rust
use std::env;

#[derive(Debug)]
struct AppConfig {
    database_url: String,
    api_key: String,
    log_level: String,
    port: u16,
}

impl AppConfig {
    fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(AppConfig {
            database_url: env::var("DATABASE_URL")?,
            api_key: env::var("API_KEY")?,
            log_level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()?,
        })
    }
}

fn main() {
    let config = AppConfig::from_env()
        .unwrap_or_else(|e| {
            eprintln!("Configuration error: {}", e);
            std::process::exit(1);
        });
    
    println!("Config: {:?}", config);
}
```

## Logging

### Using the log crate
```rust
use log::{debug, error, info, warn};

fn main() {
    env_logger::init();
    
    info!("Application starting");
    debug!("Debug information");
    warn!("Warning message");
    error!("Error occurred");
    
    // Your application logic
}
```

### Advanced Logging with tracing
```rust
use tracing::{debug, error, info, warn, instrument};
use tracing_subscriber;

#[instrument]
fn process_data(data: &str) -> Result<String, Box<dyn std::error::Error>> {
    info!("Processing data: {}", data);
    
    // Processing logic
    let result = data.to_uppercase();
    
    debug!("Processing complete: {}", result);
    Ok(result)
}

fn main() {
    tracing_subscriber::fmt::init();
    
    info!("Application starting");
    
    match process_data("hello world") {
        Ok(result) => info!("Result: {}", result),
        Err(e) => error!("Processing failed: {}", e),
    }
}
```

## Error Handling

### Graceful Error Handling
```rust
use anyhow::{Context, Result};
use std::fs;

fn read_config(path: &str) -> Result<String> {
    fs::read_to_string(path)
        .with_context(|| format!("Failed to read config file: {}", path))
}

fn main() -> Result<()> {
    let config = read_config("config.toml")?;
    println!("Config loaded successfully");
    Ok(())
}
```

### Custom Error Types
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Configuration error: {0}")]
    Config(String),
    
    #[error("Database connection failed")]
    Database(#[from] sqlx::Error),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

fn main() -> Result<(), AppError> {
    // Application logic that can return AppError
    Ok(())
}
```

## Signal Handling

### Handling Shutdown Signals
```rust
use tokio::signal;
use tokio::sync::broadcast;

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("Failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
    
    println!("Shutdown signal received");
}

#[tokio::main]
async fn main() {
    let (shutdown_tx, _) = broadcast::channel(1);
    
    // Start your application tasks
    let app_task = tokio::spawn(async move {
        // Your application logic
        tokio::time::sleep(tokio::time::Duration::from_secs(3600)).await;
    });
    
    // Wait for shutdown signal
    shutdown_signal().await;
    
    // Send shutdown signal to all tasks
    let _ = shutdown_tx.send(());
    
    // Wait for graceful shutdown
    let _ = app_task.await;
    
    println!("Application shut down gracefully");
}
```

## Best Practices

### Runtime Configuration
- Use environment variables for deployment-specific settings
- Provide sensible defaults for optional configurations
- Validate configuration at startup
- Use structured logging for better debugging

### Error Handling
- Use Result types for recoverable errors
- Implement proper error context
- Log errors with appropriate levels
- Provide helpful error messages

### Performance Monitoring
- Use profiling tools to identify bottlenecks
- Monitor memory usage in production
- Set up proper logging and metrics
- Use flamegraphs for performance analysis

### Development Workflow
- Use cargo-watch for automatic rebuilds
- Set up proper debugging configurations
- Use environment-specific configurations
- Implement graceful shutdown handling