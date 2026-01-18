use dotenv::dotenv;
use std::sync::Arc;
use tower_http::trace::TraceLayer;
use tracing_subscriber;

mod config;
mod entities;
mod handlers;
mod middleware;
mod routes;
mod services;
mod utils;

use config::Config;
use config::database::create_connection;
use middleware::cors::create_cors_layer;
use routes::create_router;
use sea_orm::{ConnectionTrait, Statement};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables from .env file
    // Try to load .env file - fail if it doesn't exist
    if let Err(e) = dotenv() {
        eprintln!("Warning: Failed to load .env file: {}", e);
        eprintln!("Please ensure .env file exists in the project root");
    }

    // Initialize tracing
    tracing_subscriber::fmt()
        .with_target(false)
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "road_trip_backend=debug,info".into()),
        )
        .init();

    // Load configuration
    let config = Config::from_env()?;
    let config = Arc::new(config);

    tracing::info!("Starting Road Trip Buddy backend...");
    tracing::info!("Server will listen on {}:{}", config.server.host, config.server.port);

    // Create database connection
    let db = create_connection(&config.database.url).await?;
    let db = Arc::new(db);

    // Run migrations using SeaORM SchemaManager
    // Note: For production, use sea-orm-cli instead: `cargo install sea-orm-cli && sea-orm-cli migrate up`
    tracing::info!("Running database migrations...");
    run_migrations_seaorm(&*db).await.map_err(|e| {
        tracing::error!("Migration failed: {}", e);
        e
    })?;
    tracing::info!("Database migrations completed");

    // Create router
    let app = create_router(db, config.clone())
        .layer(create_cors_layer(&config))
        .layer(TraceLayer::new_for_http());

    // Start server
    let addr = format!("{}:{}", config.server.host, config.server.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    tracing::info!("🚀 Server running on http://{}", addr);
    
    // In Axum 0.8, Router<()> has into_make_service() method
    // Since create_router returns Router<()> (after calling with_state),
    // we can use into_make_service() to convert it to MakeService
    axum::serve(listener, app.into_make_service()).await?;

    Ok(())
}

async fn run_migrations_seaorm(db: &sea_orm::DatabaseConnection) -> Result<(), Box<dyn std::error::Error>> {
    // Create tables using SQL statements
    // This is a simplified approach - for production, use sea-orm-cli
    
    // Create users table
    let stmt = Statement::from_string(
        db.get_database_backend(),
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            name VARCHAR NOT NULL,
            email VARCHAR NOT NULL UNIQUE,
            password_hash VARCHAR NOT NULL,
            avatar VARCHAR,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#
    );
    db.execute(stmt).await?;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"
    );
    db.execute(stmt).await?;
    
    // Create sessions table
    let stmt = Statement::from_string(
        db.get_database_backend(),
        r#"
        CREATE TABLE IF NOT EXISTS sessions (
            id UUID PRIMARY KEY,
            session_token VARCHAR NOT NULL UNIQUE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#
    );
    db.execute(stmt).await?;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)"
    );
    db.execute(stmt).await?;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)"
    );
    db.execute(stmt).await?;
    
    // Create rooms table
    let stmt = Statement::from_string(
        db.get_database_backend(),
        r#"
        CREATE TABLE IF NOT EXISTS rooms (
            id UUID PRIMARY KEY,
            name VARCHAR NOT NULL,
            description VARCHAR,
            created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN NOT NULL DEFAULT true
        )
        "#
    );
    db.execute(stmt).await?;
    
    // Add is_active column if it doesn't exist (for existing tables)
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true"
    );
    let _ = db.execute(stmt).await; // Ignore error if column already exists
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by)"
    );
    db.execute(stmt).await?;
    
    // Create room_members table
    let stmt = Statement::from_string(
        db.get_database_backend(),
        r#"
        CREATE TABLE IF NOT EXISTS room_members (
            id UUID PRIMARY KEY,
            room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(room_id, user_id)
        )
        "#
    );
    db.execute(stmt).await?;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id)"
    );
    db.execute(stmt).await?;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id)"
    );
    db.execute(stmt).await?;
    
    // Create messages table
    let stmt = Statement::from_string(
        db.get_database_backend(),
        r#"
        CREATE TABLE IF NOT EXISTS messages (
            id UUID PRIMARY KEY,
            room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            text VARCHAR,
            image_url VARCHAR,
            message_type VARCHAR NOT NULL DEFAULT 'text',
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#
    );
    db.execute(stmt).await?;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id)"
    );
    db.execute(stmt).await?;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)"
    );
    db.execute(stmt).await?;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)"
    );
    db.execute(stmt).await?;
    
    // Create locations table
    let stmt = Statement::from_string(
        db.get_database_backend(),
        r#"
        CREATE TABLE IF NOT EXISTS locations (
            id UUID PRIMARY KEY,
            room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#
    );
    db.execute(stmt).await?;
    
    // Add timestamp column if it doesn't exist (for existing tables)
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "ALTER TABLE locations ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP"
    );
    let _ = db.execute(stmt).await; // Ignore error if column already exists
    
    // Remove updated_at column if it exists (migration from old schema)
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "ALTER TABLE locations DROP COLUMN IF EXISTS updated_at"
    );
    let _ = db.execute(stmt).await; // Ignore error if column doesn't exist
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "CREATE INDEX IF NOT EXISTS idx_locations_room_id ON locations(room_id)"
    );
    db.execute(stmt).await?;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id)"
    );
    db.execute(stmt).await?;
    
    // Create voice_calls table
    let stmt = Statement::from_string(
        db.get_database_backend(),
        r#"
        CREATE TABLE IF NOT EXISTS voice_calls (
            id UUID PRIMARY KEY,
            room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
            initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR NOT NULL DEFAULT 'ringing',
            start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            end_time TIMESTAMPTZ
        )
        "#
    );
    db.execute(stmt).await?;
    
    // Migrate existing table if needed (rename columns)
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "ALTER TABLE voice_calls DROP COLUMN IF EXISTS caller_id CASCADE"
    );
    let _ = db.execute(stmt).await; // Ignore error if column doesn't exist
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS initiator_id UUID REFERENCES users(id) ON DELETE CASCADE"
    );
    let _ = db.execute(stmt).await;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "ALTER TABLE voice_calls DROP COLUMN IF EXISTS started_at CASCADE"
    );
    let _ = db.execute(stmt).await;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP"
    );
    let _ = db.execute(stmt).await;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "ALTER TABLE voice_calls DROP COLUMN IF EXISTS ended_at CASCADE"
    );
    let _ = db.execute(stmt).await;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ"
    );
    let _ = db.execute(stmt).await;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "ALTER TABLE voice_calls DROP COLUMN IF EXISTS created_at CASCADE"
    );
    let _ = db.execute(stmt).await;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "CREATE INDEX IF NOT EXISTS idx_voice_calls_room_id ON voice_calls(room_id)"
    );
    db.execute(stmt).await?;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "CREATE INDEX IF NOT EXISTS idx_voice_calls_initiator_id ON voice_calls(initiator_id)"
    );
    db.execute(stmt).await?;
    
    let stmt = Statement::from_string(
        db.get_database_backend(),
        "CREATE INDEX IF NOT EXISTS idx_voice_calls_status ON voice_calls(status)"
    );
    db.execute(stmt).await?;
    
    tracing::info!("All database tables created successfully");
    
    Ok(())
}
