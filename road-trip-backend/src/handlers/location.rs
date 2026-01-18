use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::entities::user;
use crate::entities::location;

#[derive(Deserialize)]
pub struct UpdateLocationRequest {
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Serialize)]
pub struct LocationResponse {
    pub id: Uuid,
    pub user_id: Uuid,
    pub room_id: Uuid,
    pub latitude: f64,
    pub longitude: f64,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize)]
pub struct LocationsResponse {
    pub locations: Vec<LocationResponse>,
}

impl From<location::Model> for LocationResponse {
    fn from(loc: location::Model) -> Self {
        Self {
            id: loc.id,
            user_id: loc.user_id,
            room_id: loc.room_id,
            latitude: loc.latitude,
            longitude: loc.longitude,
            timestamp: loc.timestamp,
        }
    }
}

pub async fn update_location(
    State(app_state): State<crate::routes::AppState>,
    Extension(user): Extension<user::Model>,
    Path(room_id): Path<Uuid>,
    Json(payload): Json<UpdateLocationRequest>,
) -> Result<Json<LocationResponse>, (StatusCode, Json<serde_json::Value>)> {
    let location = app_state.location_service
        .update_location(user.id, room_id, payload.latitude, payload.longitude)
        .await
        .map_err(|e| {
            let error_msg = format!("{}", e);
            let status = if error_msg.contains("not a member") {
                StatusCode::FORBIDDEN
            } else {
                StatusCode::INTERNAL_SERVER_ERROR
            };
            (
                status,
                Json(serde_json::json!({"error": error_msg})),
            )
        })?;

    Ok(Json(LocationResponse::from(location)))
}

pub async fn get_locations(
    State(app_state): State<crate::routes::AppState>,
    Extension(user): Extension<user::Model>,
    Path(room_id): Path<Uuid>,
) -> Result<Json<LocationsResponse>, (StatusCode, Json<serde_json::Value>)> {
    // Verify membership
    let is_member = app_state.location_service
        .verify_membership(room_id, user.id)
        .await
        .map_err(|e| {
            let error_msg = format!("{}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": error_msg})),
            )
        })?;

    if !is_member {
        return Err((
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({"error": "You are not a member of this room"})),
        ));
    }

    let locations = app_state.location_service
        .get_locations(room_id)
        .await
        .map_err(|e| {
            let error_msg = format!("{}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": error_msg})),
            )
        })?;

    let locations_response: Vec<LocationResponse> = locations
        .into_iter()
        .map(LocationResponse::from)
        .collect();

    Ok(Json(LocationsResponse {
        locations: locations_response,
    }))
}
