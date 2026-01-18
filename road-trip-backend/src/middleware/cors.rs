use axum::http::{header, HeaderName, HeaderValue, Method};
use tower_http::cors::{Any, CorsLayer};

use crate::config::Config;

pub fn create_cors_layer(config: &Config) -> CorsLayer {
    let mut cors = CorsLayer::new()
        // Cannot use `Any` with `allow_credentials(true)`, must specify methods explicitly
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::PATCH,
            Method::OPTIONS,
        ])
        // Cannot use `Any` with `allow_credentials(true)`, must specify headers explicitly
        .allow_headers([
            header::CONTENT_TYPE,
            header::AUTHORIZATION,
            header::COOKIE,
            header::ACCEPT,
            header::ACCEPT_LANGUAGE,
            header::ORIGIN,
            HeaderName::from_static("x-requested-with"),
        ])
        .allow_credentials(true);

    if config.cors.allowed_origins.contains(&"*".to_string()) {
        cors = cors.allow_origin(Any);
    } else {
        let origins: Vec<HeaderValue> = config
            .cors
            .allowed_origins
            .iter()
            .filter_map(|origin| origin.parse().ok())
            .collect();
        cors = cors.allow_origin(origins);
    }

    cors
}
