use axum::{
    middleware,
    routing::{get, post},
    Router,
};
use std::sync::Arc;

use crate::config::Config;
use crate::handlers::auth::{get_current_user, login, logout, register};
use crate::handlers::room::{create_room, get_rooms, join_room, get_room_members};
use crate::handlers::message::{send_message, get_messages};
use crate::handlers::location::{update_location, get_locations};
use crate::middleware::auth::auth_middleware;
use crate::services::{AuthService, RoomService, MessageService, LocationService};
use crate::services::websocket::{WebSocketService, websocket_handler};
use sea_orm::DatabaseConnection;

#[derive(Clone)]
pub struct AppState {
    pub auth_service: Arc<AuthService>,
    pub room_service: Arc<RoomService>,
    pub message_service: Arc<MessageService>,
    pub location_service: Arc<LocationService>,
    pub websocket_service: Arc<WebSocketService>,
}

pub fn create_router(
    db: Arc<DatabaseConnection>,
    config: Arc<Config>,
) -> Router<()> {
    let app_state = AppState {
        auth_service: Arc::new(AuthService::new((*db).clone())),
        room_service: Arc::new(RoomService::new((*db).clone())),
        message_service: Arc::new(MessageService::new((*db).clone())),
        location_service: Arc::new(LocationService::new((*db).clone())),
        websocket_service: Arc::new(WebSocketService::new()),
    };

    let auth_layer = middleware::from_fn(auth_middleware);

    Router::new()
        .route("/api/health", get(health_check))
        // Public routes
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        // Protected auth routes
        .route(
            "/api/auth/logout",
            post(logout).layer(auth_layer.clone()),
        )
        .route(
            "/api/auth/me",
            get(get_current_user).layer(auth_layer.clone()),
        )
        // Protected room routes
        .route(
            "/api/rooms",
            post(create_room).get(get_rooms).layer(auth_layer.clone()),
        )
        .route(
            "/api/rooms/join",
            post(join_room).layer(auth_layer.clone()),
        )
        .route(
            "/api/rooms/{room_id}/members",
            get(get_room_members).layer(auth_layer.clone()),
        )
        // Protected message routes
        .route(
            "/api/rooms/{room_id}/messages",
            get(get_messages).post(send_message).layer(auth_layer.clone()),
        )
        // Protected location routes
        .route(
            "/api/rooms/{room_id}/location",
            post(update_location).layer(auth_layer.clone()),
        )
        .route(
            "/api/rooms/{room_id}/locations",
            get(get_locations).layer(auth_layer.clone()),
        )
        // WebSocket route
        .route("/ws", axum::routing::get(websocket_handler))
        .with_state(app_state)
        .layer(axum::Extension(config))
        .layer(axum::Extension(db))
}

async fn health_check() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({
        "status": "ok",
        "message": "Road Trip Buddy API is running"
    }))
}
