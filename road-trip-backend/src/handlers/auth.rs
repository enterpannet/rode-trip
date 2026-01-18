use axum::{
    extract::{Extension, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
pub use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::config::Config;
use crate::entities::user;
use crate::services::AuthService;
use crate::utils::cookie;

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub name: String,
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct UserResponse {
    pub id: uuid::Uuid,
    pub name: String,
    pub email: String,
    pub avatar: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<user::Model> for UserResponse {
    fn from(user: user::Model) -> Self {
        Self {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }
    }
}

pub async fn register(
    State(app_state): State<crate::routes::AppState>,
    Extension(config): Extension<Arc<Config>>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Response, (StatusCode, Json<serde_json::Value>)> {
    // Register user
    let password = payload.password.clone();
    let user = app_state.auth_service
        .register(payload.name, payload.email, password.clone())
        .await
        .map_err(|e| {
            let error_msg = format!("{}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": error_msg})),
            )
        })?;

    // Login user (create session)
    let (_, session_token) = app_state.auth_service
        .login(user.email.clone(), password)
        .await
        .map_err(|e| {
            let error_msg = format!("{}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": error_msg})),
            )
        })?;

    // Create cookie
    let cookie = cookie::create_session_cookie(&session_token, &config.auth);

    let response = Json(UserResponse::from(user)).into_response();
    
    Ok((
        [(axum::http::header::SET_COOKIE, cookie.to_string())],
        response,
    )
        .into_response())
}

pub async fn login(
    State(app_state): State<crate::routes::AppState>,
    Extension(config): Extension<Arc<Config>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Response, (StatusCode, Json<serde_json::Value>)> {
    // Login user
    let (user, session_token) = app_state.auth_service
        .login(payload.email, payload.password)
        .await
        .map_err(|e| {
            let error_msg = format!("{}", e);
            (
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({"error": "Invalid email or password"})),
            )
        })?;

    // Create cookie
    let cookie = cookie::create_session_cookie(&session_token, &config.auth);

    let response = Json(UserResponse::from(user)).into_response();
    
    Ok((
        [(axum::http::header::SET_COOKIE, cookie.to_string())],
        response,
    )
        .into_response())
}

pub async fn logout(
    State(app_state): State<crate::routes::AppState>,
    Extension(config): Extension<Arc<Config>>,
    Extension(user): Extension<user::Model>,
) -> Result<Response, StatusCode> {
    // Extract session token from cookie
    // This is simplified - in production, extract from request headers
    // For now, we'll just clear the cookie
    let cookie = cookie::create_logout_cookie(&config.auth);

    app_state.auth_service
        .logout(&"") // Session token should be extracted from request
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = Json(serde_json::json!({"message": "Logged out successfully"}))
        .into_response();

    Ok((
        [(axum::http::header::SET_COOKIE, cookie.to_string())],
        response,
    )
        .into_response())
}

pub async fn get_current_user(
    Extension(user): Extension<user::Model>,
) -> Result<Json<UserResponse>, StatusCode> {
    Ok(Json(UserResponse::from(user)))
}

pub async fn get_session_token(
    State(app_state): State<crate::routes::AppState>,
    Extension(config): Extension<Arc<Config>>,
    Extension(user): Extension<user::Model>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // Extract session token from cookie header
    // Since we can't access cookies directly here, we need to extract from request
    // For now, we'll get the latest session for this user
    use crate::entities::session;
    use sea_orm::{ColumnTrait, EntityTrait, QueryFilter, QueryOrder};
    
    let latest_session = session::Entity::find()
        .filter(session::Column::UserId.eq(user.id))
        .filter(session::Column::ExpiresAt.gt(chrono::Utc::now()))
        .order_by_desc(session::Column::CreatedAt)
        .one(app_state.db.as_ref())
        .await;
    
    match latest_session {
        Ok(Some(session)) => {
            Ok(Json(serde_json::json!({
                "token": session.session_token
            })))
        }
        Ok(None) => Err((
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({"error": "No valid session found"})),
        )),
        Err(_) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Failed to get session token"})),
        )),
    }
}
