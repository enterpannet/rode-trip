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
    // Create tables directly using SQL generated from SeaORM entities
    // This is a simplified approach - for production, use sea-orm-cli
    
    let backend = db.get_database_backend();
    let schema = Schema::new(backend);
    
    // Create users table
    let stmt = schema.create_table_from_entity(crate::entities::user::Entity);
    db.execute(stmt).await?;
    
    // Create sessions table
    let stmt = schema.create_table_from_entity(crate::entities::session::Entity);
    db.execute(stmt).await?;
    
    // Create rooms table
    let stmt = schema.create_table_from_entity(crate::entities::room::Entity);
    db.execute(stmt).await?;
    
    // Create room_members table
    let stmt = schema.create_table_from_entity(crate::entities::room_member::Entity);
    db.execute(stmt).await?;
    
    // Create messages table
    let stmt = schema.create_table_from_entity(crate::entities::message::Entity);
    db.execute(stmt).await?;
    
    // Create locations table
    let stmt = schema.create_table_from_entity(crate::entities::location::Entity);
    db.execute(stmt).await?;
    
    // Create voice_calls table
    let stmt = schema.create_table_from_entity(crate::entities::voice_call::Entity);
    db.execute(stmt).await?;
    
    Ok(())
}
