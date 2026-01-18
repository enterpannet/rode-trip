use anyhow::Result;
use chrono::{Duration, Utc};
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use uuid::Uuid;

use crate::entities::{session, user};
use crate::utils::{cookie, password};

pub struct AuthService {
    db: DatabaseConnection,
}

impl AuthService {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    pub async fn register(
        &self,
        name: String,
        email: String,
        password: String,
    ) -> Result<user::Model> {
        // Check if user already exists
        let existing_user = user::Entity::find()
            .filter(user::Column::Email.eq(&email))
            .one(&self.db)
            .await?;

        if existing_user.is_some() {
            return Err(anyhow::anyhow!("User with this email already exists"));
        }

        // Hash password
        let password_hash = password::hash_password(&password)?;

        // Create user
        let new_user = user::ActiveModel {
            id: Set(Uuid::new_v4()),
            name: Set(name),
            email: Set(email),
            password_hash: Set(password_hash),
            avatar: Set(None),
            created_at: Set(Utc::now()),
            updated_at: Set(Utc::now()),
        };

        let user = new_user.insert(&self.db).await?;
        Ok(user)
    }

    pub async fn login(&self, email: String, password: String) -> Result<(user::Model, String)> {
        // Find user by email
        let user = user::Entity::find()
            .filter(user::Column::Email.eq(&email))
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Invalid email or password"))?;

        // Verify password
        let is_valid = password::verify_password(&password, &user.password_hash)?;
        if !is_valid {
            return Err(anyhow::anyhow!("Invalid email or password"));
        }

        // Generate session token
        let session_token = cookie::generate_session_token();

        // Create session
        let expires_at = Utc::now() + Duration::days(7);
        let new_session = session::ActiveModel {
            id: Set(Uuid::new_v4()),
            session_token: Set(session_token.clone()),
            user_id: Set(user.id),
            expires_at: Set(expires_at),
            created_at: Set(Utc::now()),
        };

        new_session.insert(&self.db).await?;

        Ok((user, session_token))
    }

    pub async fn validate_session(&self, session_token: &str) -> Result<user::Model> {
        // Find session
        let session = session::Entity::find()
            .filter(session::Column::SessionToken.eq(session_token))
            .filter(session::Column::ExpiresAt.gt(Utc::now()))
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Invalid or expired session"))?;

        // Find user
        let user = user::Entity::find_by_id(session.user_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("User not found"))?;

        Ok(user)
    }

    pub async fn logout(&self, session_token: &str) -> Result<()> {
        // Delete session
        let session = session::Entity::find()
            .filter(session::Column::SessionToken.eq(session_token))
            .one(&self.db)
            .await?;

        if let Some(session) = session {
            session::Entity::delete_by_id(session.id)
                .exec(&self.db)
                .await?;
        }

        Ok(())
    }

    pub async fn get_user_by_id(&self, user_id: Uuid) -> Result<user::Model> {
        user::Entity::find_by_id(user_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("User not found"))
    }
}
