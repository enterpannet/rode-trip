use anyhow::Result;
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set};
use uuid::Uuid;

use crate::entities::{room, room_member, user};

pub struct RoomService {
    db: DatabaseConnection,
}

impl RoomService {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    pub async fn create_room(
        &self,
        name: String,
        description: Option<String>,
        created_by: Uuid,
    ) -> Result<room::Model> {
        let new_room = room::ActiveModel {
            id: Set(Uuid::new_v4()),
            name: Set(name),
            description: Set(description),
            created_by: Set(created_by),
            created_at: Set(Utc::now()),
            updated_at: Set(Utc::now()),
            is_active: Set(true),
        };

        let room = new_room.insert(&self.db).await?;

        // Add creator as member
        self.join_room(room.id, created_by).await?;

        Ok(room)
    }

    pub async fn get_user_rooms(&self, user_id: Uuid) -> Result<Vec<room::Model>> {
        let rooms = room::Entity::find()
            .inner_join(room_member::Entity)
            .filter(room_member::Column::UserId.eq(user_id))
            .filter(room::Column::IsActive.eq(true))
            .order_by_desc(room::Column::UpdatedAt)
            .all(&self.db)
            .await?;

        Ok(rooms)
    }

    pub async fn get_room_by_id(&self, room_id: Uuid) -> Result<room::Model> {
        room::Entity::find_by_id(room_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Room not found"))
    }

    pub async fn join_room(&self, room_id: Uuid, user_id: Uuid) -> Result<room_member::Model> {
        // Check if room exists
        self.get_room_by_id(room_id).await?;

        // Check if already a member
        let existing = room_member::Entity::find()
            .filter(room_member::Column::RoomId.eq(room_id))
            .filter(room_member::Column::UserId.eq(user_id))
            .one(&self.db)
            .await?;

        if existing.is_some() {
            return existing.ok_or_else(|| anyhow::anyhow!("Already a member"));
        }

        let new_member = room_member::ActiveModel {
            id: Set(Uuid::new_v4()),
            room_id: Set(room_id),
            user_id: Set(user_id),
            joined_at: Set(Utc::now()),
        };

        let member = new_member.insert(&self.db).await?;
        Ok(member)
    }

    pub async fn get_room_members(&self, room_id: Uuid) -> Result<Vec<user::Model>> {
        // Verify room exists
        self.get_room_by_id(room_id).await?;

        let members = user::Entity::find()
            .inner_join(room_member::Entity)
            .filter(room_member::Column::RoomId.eq(room_id))
            .all(&self.db)
            .await?;

        Ok(members)
    }

    pub async fn leave_room(&self, room_id: Uuid, user_id: Uuid) -> Result<()> {
        room_member::Entity::delete_many()
            .filter(room_member::Column::RoomId.eq(room_id))
            .filter(room_member::Column::UserId.eq(user_id))
            .exec(&self.db)
            .await?;

        Ok(())
    }

    pub async fn is_member(&self, room_id: Uuid, user_id: Uuid) -> Result<bool> {
        let member = room_member::Entity::find()
            .filter(room_member::Column::RoomId.eq(room_id))
            .filter(room_member::Column::UserId.eq(user_id))
            .one(&self.db)
            .await?;

        Ok(member.is_some())
    }
}
