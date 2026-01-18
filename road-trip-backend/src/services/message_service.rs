use anyhow::Result;
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder, Set};
use uuid::Uuid;

use crate::entities::{message, room_member};

pub struct MessageService {
    db: DatabaseConnection,
}

impl MessageService {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    pub async fn send_message(
        &self,
        room_id: Uuid,
        user_id: Uuid,
        text: Option<String>,
        image_url: Option<String>,
        message_type: String,
    ) -> Result<message::Model> {
        let new_message = message::ActiveModel {
            id: Set(Uuid::new_v4()),
            room_id: Set(room_id),
            user_id: Set(user_id),
            text: Set(text),
            image_url: Set(image_url),
            message_type: Set(message_type),
            created_at: Set(Utc::now()),
        };

        let message = new_message.insert(&self.db).await?;
        Ok(message)
    }

    pub async fn get_messages(
        &self,
        room_id: Uuid,
        page: u64,
        page_size: u64,
    ) -> Result<(Vec<message::Model>, u64)> {
        let paginator = message::Entity::find()
            .filter(message::Column::RoomId.eq(room_id))
            .order_by_desc(message::Column::CreatedAt)
            .paginate(&self.db, page_size);

        let total_pages = paginator.num_pages().await?;
        let messages = paginator.fetch_page(page).await?;

        Ok((messages, total_pages))
    }

    pub async fn verify_membership(&self, room_id: Uuid, user_id: Uuid) -> Result<bool> {
        let member = room_member::Entity::find()
            .filter(room_member::Column::RoomId.eq(room_id))
            .filter(room_member::Column::UserId.eq(user_id))
            .one(&self.db)
            .await?;

        Ok(member.is_some())
    }
}
