use sea_orm::{Database, DatabaseConnection};
use sqlx::{postgres::PgConnectOptions, PgPool, Postgres};
use tracing::{info, warn};
use url::Url;

pub async fn create_connection(database_url: &str) -> Result<DatabaseConnection, anyhow::Error> {
    info!("Connecting to database...");
    
    // Try to connect first
    match Database::connect(database_url).await {
        Ok(db) => {
            info!("Database connection established");
            return Ok(db);
        }
        Err(e) => {
            // Check if error is "database does not exist"
            let error_msg = format!("{}", e);
            if error_msg.contains("does not exist") || error_msg.contains("database") && error_msg.contains("not exist") {
                warn!("Database does not exist, attempting to create it...");
                
                // Parse the database URL
                let url = Url::parse(database_url)?;
                let db_name = url.path().trim_start_matches('/');
                
                if db_name.is_empty() || db_name == "/" {
                    return Err(anyhow::anyhow!("Invalid database name in DATABASE_URL"));
                }
                
                // Create connection URL to 'postgres' database (default database)
                let mut admin_url = url.clone();
                admin_url.set_path("/postgres");
                let admin_url_str = admin_url.to_string();
                
                // Create database using SQLx
                info!("Connecting to PostgreSQL server to create database '{}'...", db_name);
                let admin_pool = PgPool::connect(&admin_url_str).await?;
                
                // Check if database exists
                let db_exists: bool = sqlx::query_scalar::<Postgres, bool>(
                    "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1)"
                )
                .bind(db_name)
                .fetch_one(&admin_pool)
                .await?;
                
                if !db_exists {
                    // Create database
                    // Note: CREATE DATABASE cannot be executed in a transaction
                    // We need to use raw SQL without query parameters
                    info!("Creating database '{}'...", db_name);
                    // Use query_scalar to execute raw SQL
                    sqlx::query(&format!("CREATE DATABASE {}", db_name.replace("'", "''")))
                        .execute(&admin_pool)
                        .await?;
                    info!("Database '{}' created successfully", db_name);
                } else {
                    info!("Database '{}' already exists", db_name);
                }
                
                // Close admin connection
                admin_pool.close().await;
                
                // Now try to connect to the newly created database
                info!("Connecting to database '{}'...", db_name);
                let db = Database::connect(database_url).await?;
                info!("Database connection established");
                return Ok(db);
            } else {
                // Other connection errors, return as-is
                return Err(e.into());
            }
        }
    }
}
