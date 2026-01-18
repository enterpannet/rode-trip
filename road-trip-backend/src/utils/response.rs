use axum::Json;
use serde::Serialize;

#[derive(Serialize)]
pub struct SuccessResponse {
    pub message: String,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

pub fn success(message: impl Into<String>) -> Json<SuccessResponse> {
    Json(SuccessResponse {
        message: message.into(),
    })
}

pub fn error(error: impl Into<String>) -> Json<ErrorResponse> {
    Json(ErrorResponse {
        error: error.into(),
    })
}
