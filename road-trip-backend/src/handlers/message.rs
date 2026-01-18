use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::entities::user;
use crate::entities::message;

#[derive(Deserialize)]
pub struct SendMessageRequest {
    pub text: Option<String>,
    pub image_url: Option<String>,
    #[serde(default = "default_message_type")]
    pub message_type: String,
}

fn default_message_type() -> String {
    "text".to_string()
}

#[derive(Deserialize)]
pub struct GetMessagesQuery {
    #[serde(default = "default_page")]
    pub page: u64,
    #[serde(default = "default_page_size")]
    pub page_size: u64,
}

fn default_page() -> u64 {
    0
}

fn default_page_size() -> u64 {
    20
}

#[derive(Serialize)]
pub struct MessageResponse {
    pub id: Uuid,
    pub room_id: Uuid,
    pub user_id: Uuid,
    pub text: Option<String>,
    pub image_url: Option<String>,
    pub message_type: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize)]
pub struct MessagesResponse {
    pub messages: Vec<MessageResponse>,
    pub total_pages: u64,
    pub current_page: u64,
}

impl From<message::Model> for MessageResponse {
    fn from(msg: message::Model) -> Self {
        Self {
            id: msg.id,
            room_id: msg.room_id,
            user_id: msg.user_id,
            text: msg.text,
            image_url: msg.image_url,
            message_type: msg.message_type,
            created_at: msg.created_at,
        }
    }
}

pub async fn send_message(
    State(app_state): State<crate::routes::AppState>,
    Extension(user): Extension<user::Model>,
    Path(room_id): Path<Uuid>,
    Json(payload): Json<SendMessageRequest>,
) -> Result<Json<MessageResponse>, StatusCode> {
    // Verify membership
    let is_member = app_state.message_service
        .verify_membership(room_id, user.id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if !is_member {
        return Err(StatusCode::FORBIDDEN);
    }

    // Validate message type
    let message_type = if payload.text.is_some() {
        "text".to_string()
    } else if payload.image_url.is_some() {
        "image".to_string()
    } else {
        return Err(StatusCode::BAD_REQUEST);
    };

    let message = app_state.message_service
        .send_message(
            room_id,
            user.id,
            payload.text,
            payload.image_url,
            message_type,
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(MessageResponse::from(message)))
}

pub async fn get_messages(
    State(app_state): State<crate::routes::AppState>,
    Extension(user): Extension<user::Model>,
    Path(room_id): Path<Uuid>,
    Query(query): Query<GetMessagesQuery>,
) -> Result<Json<MessagesResponse>, StatusCode> {
    // Verify membership
    let is_member = app_state.message_service
        .verify_membership(room_id, user.id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if !is_member {
        return Err(StatusCode::FORBIDDEN);
    }

    let (messages, total_pages) = app_state.message_service
        .get_messages(room_id, query.page, query.page_size)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let messages_response: Vec<MessageResponse> = messages
        .into_iter()
        .map(MessageResponse::from)
        .collect();

    Ok(Json(MessagesResponse {
        messages: messages_response,
        total_pages,
        current_page: query.page,
    }))
}
