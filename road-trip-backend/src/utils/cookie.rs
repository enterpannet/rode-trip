use axum::{
    http::{HeaderValue, Request},
    middleware::Next,
    response::Response,
};
use cookie::{Cookie, SameSite};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use crate::config::AuthConfig;

pub fn create_session_cookie(
    token: &str,
    config: &AuthConfig,
) -> Cookie<'static> {
    let max_age = config.session_expiration_days * 24 * 60 * 60;
    
    let same_site = match config.cookie_same_site.as_str() {
        "Lax" => SameSite::Lax,
        "None" => SameSite::None,
        _ => SameSite::Strict,
    };
    
    let mut cookie = Cookie::build((config.cookie_name.clone(), token.to_string()))
        .http_only(true)
        .max_age(cookie::time::Duration::seconds(max_age as i64))
        .path("/")
        .same_site(same_site);
    
    if config.cookie_secure {
        cookie = cookie.secure(true);
    }
    
    if let Some(ref domain) = config.cookie_domain {
        cookie = cookie.domain(domain.clone());
    }
    
    cookie.build()
}

pub fn create_logout_cookie(config: &AuthConfig) -> Cookie<'static> {
    let mut cookie = Cookie::build(config.cookie_name.clone())
        .http_only(true)
        .max_age(cookie::time::Duration::seconds(0))
        .path("/");
    
    if config.cookie_secure {
        cookie = cookie.secure(true);
    }
    
    if let Some(ref domain) = config.cookie_domain {
        cookie = cookie.domain(domain.clone());
    }
    
    cookie.build()
}

pub fn generate_session_token() -> String {
    use sha2::{Digest, Sha256};
    use rand::Rng;
    
    let mut rng = rand::thread_rng();
    let random_bytes: Vec<u8> = (0..32).map(|_| rng.gen()).collect();
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    
    let mut hasher = Sha256::new();
    hasher.update(&random_bytes);
    hasher.update(timestamp.to_be_bytes());
    
    format!("{:x}", hasher.finalize())
}
