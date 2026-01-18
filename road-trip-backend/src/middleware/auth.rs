use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use std::sync::Arc;

use crate::config::Config;
use crate::services::AuthService;

pub async fn auth_middleware(
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Extract cookie from request
    let cookie_header = req.headers().get("Cookie");
    
    if let Some(cookie_header) = cookie_header {
        let cookie_str = cookie_header.to_str().unwrap_or("");
        let cookies: Vec<&str> = cookie_str.split(';').collect();
        
        let config = req
            .extensions()
            .get::<Arc<Config>>()
            .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
        
        let cookie_name = &config.auth.cookie_name;
        
        // Find session token cookie
        for cookie in cookies {
            let cookie = cookie.trim();
            if cookie.starts_with(&format!("{}=", cookie_name)) {
                let session_token = cookie
                    .split('=')
                    .nth(1)
                    .ok_or(StatusCode::UNAUTHORIZED)?;
                
                // Validate session
                let db = req
                    .extensions()
                    .get::<Arc<sea_orm::DatabaseConnection>>()
                    .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
                
                let auth_service = AuthService::new((**db).clone());
                
                match auth_service.validate_session(session_token).await {
                    Ok(user) => {
                        // Add user to request extensions
                        req.extensions_mut().insert(user);
                        return Ok(next.run(req).await);
                    }
                    Err(_) => {
                        return Err(StatusCode::UNAUTHORIZED);
                    }
                }
            }
        }
    }
    
    Err(StatusCode::UNAUTHORIZED)
}
