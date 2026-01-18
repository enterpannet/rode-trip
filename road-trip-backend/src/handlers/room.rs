use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::entities::user;
use crate::utils::response;

#[derive(Deserialize)]
pub struct CreateRoomRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Deserialize)]
pub struct JoinRoomRequest {
    pub room_id: Uuid,
}

#[derive(Serialize)]
pub struct RoomResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_by: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub is_active: bool,
}

#[derive(Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub avatar: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl From<crate::entities::room::Model> for RoomResponse {
    fn from(room: crate::entities::room::Model) -> Self {
        Self {
            id: room.id,
            name: room.name,
            description: room.description,
            created_by: room.created_by,
            created_at: room.created_at,
            updated_at: room.updated_at,
            is_active: room.is_active,
        }
    }
}

impl From<user::Model> for UserResponse {
    fn from(user: user::Model) -> Self {
        Self {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            created_at: user.created_at,
        }
    }
}

pub async fn create_room(
    State(app_state): State<crate::routes::AppState>,
    Extension(user): Extension<user::Model>,
    Json(payload): Json<CreateRoomRequest>,
) -> Result<Json<RoomResponse>, StatusCode> {
    let room = app_state.room_service
        .create_room(payload.name, payload.description, user.id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(RoomResponse::from(room)))
}

pub async fn get_rooms(
    State(app_state): State<crate::routes::AppState>,
    Extension(user): Extension<user::Model>,
) -> Result<Json<Vec<RoomResponse>>, StatusCode> {
    let rooms = app_state.room_service
        .get_user_rooms(user.id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let rooms_response: Vec<RoomResponse> = rooms
        .into_iter()
        .map(RoomResponse::from)
        .collect();

    Ok(Json(rooms_response))
}

pub async fn join_room(
    State(app_state): State<crate::routes::AppState>,
    Extension(user): Extension<user::Model>,
    Json(payload): Json<JoinRoomRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    app_state.room_service
        .join_room(payload.room_id, user.id)
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    Ok(Json(serde_json::json!({"message": "Joined room successfully"})))
}

pub async fn get_room_members(
    State(app_state): State<crate::routes::AppState>,
    Extension(user): Extension<user::Model>,
    Path(room_id): Path<Uuid>,
) -> Result<Json<Vec<UserResponse>>, StatusCode> {
    // Verify user is a member
    let is_member = app_state.room_service
        .is_member(room_id, user.id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if !is_member {
        return Err(StatusCode::FORBIDDEN);
    }

    let members = app_state.room_service
        .get_room_members(room_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let members_response: Vec<UserResponse> = members
        .into_iter()
        .map(UserResponse::from)
        .collect();

    Ok(Json(members_response))
}
