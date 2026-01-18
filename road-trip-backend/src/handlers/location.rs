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
) -> Result<Json<LocationResponse>, StatusCode> {
    let location = app_state.location_service
        .update_location(user.id, room_id, payload.latitude, payload.longitude)
        .await
        .map_err(|e| {
            if e.to_string().contains("not a member") {
                StatusCode::FORBIDDEN
            } else {
                StatusCode::INTERNAL_SERVER_ERROR
            }
        })?;

    Ok(Json(LocationResponse::from(location)))
}

pub async fn get_locations(
    State(app_state): State<crate::routes::AppState>,
    Extension(user): Extension<user::Model>,
    Path(room_id): Path<Uuid>,
) -> Result<Json<LocationsResponse>, StatusCode> {
    // Verify membership
    let is_member = app_state.location_service
        .verify_membership(room_id, user.id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if !is_member {
        return Err(StatusCode::FORBIDDEN);
    }

    let locations = app_state.location_service
        .get_locations(room_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let locations_response: Vec<LocationResponse> = locations
        .into_iter()
        .map(LocationResponse::from)
        .collect();

    Ok(Json(LocationsResponse {
        locations: locations_response,
    }))
}
