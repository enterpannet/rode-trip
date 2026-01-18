pub mod database;

use serde::Deserialize;
use std::env;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub auth: AuthConfig,
    pub cors: CorsConfig,
    pub upload: UploadConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub port: u16,
    pub host: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AuthConfig {
    pub session_secret: String,
    pub cookie_name: String,
    pub cookie_domain: Option<String>,
    pub cookie_secure: bool,
    pub cookie_same_site: String,
    pub session_expiration_days: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CorsConfig {
    pub allowed_origins: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UploadConfig {
    pub upload_dir: String,
    pub max_file_size: u64,
}

impl Config {
    pub fn from_env() -> Result<Self, anyhow::Error> {
        Ok(Config {
            server: ServerConfig {
                port: env::var("PORT")
                    .unwrap_or_else(|_| "3000".to_string())
                    .parse()
                    .unwrap_or(3000),
                host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            },
            database: DatabaseConfig {
                url: env::var("DATABASE_URL")
                    .expect("DATABASE_URL must be set"),
                max_connections: env::var("DATABASE_MAX_CONNECTIONS")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()
                    .unwrap_or(10),
            },
            auth: AuthConfig {
                session_secret: env::var("SESSION_SECRET")
                    .expect("SESSION_SECRET must be set (min 32 characters)"),
                cookie_name: env::var("COOKIE_NAME")
                    .unwrap_or_else(|_| "session_token".to_string()),
                cookie_domain: env::var("COOKIE_DOMAIN").ok(),
                cookie_secure: env::var("COOKIE_SECURE")
                    .unwrap_or_else(|_| "false".to_string())
                    .parse()
                    .unwrap_or(false),
                cookie_same_site: env::var("COOKIE_SAME_SITE")
                    .unwrap_or_else(|_| "Strict".to_string()),
                session_expiration_days: env::var("SESSION_EXPIRATION_DAYS")
                    .unwrap_or_else(|_| "7".to_string())
                    .parse()
                    .unwrap_or(7),
            },
            cors: CorsConfig {
                allowed_origins: env::var("CORS_ORIGIN")
                    .unwrap_or_else(|_| "*".to_string())
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
            },
            upload: UploadConfig {
                upload_dir: env::var("UPLOAD_DIR")
                    .unwrap_or_else(|_| "./uploads".to_string()),
                max_file_size: env::var("MAX_FILE_SIZE")
                    .unwrap_or_else(|_| "10485760".to_string())
                    .parse()
                    .unwrap_or(10_485_760), // 10MB default
            },
        })
    }
}
