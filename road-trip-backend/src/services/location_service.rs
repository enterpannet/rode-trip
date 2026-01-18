use anyhow::Result;
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set};
use uuid::Uuid;

use crate::entities::{location, room_member};

pub struct LocationService {
    db: DatabaseConnection,
}

impl LocationService {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    pub async fn update_location(
        &self,
        user_id: Uuid,
        room_id: Uuid,
        latitude: f64,
        longitude: f64,
    ) -> Result<location::Model> {
        // Verify membership
        let is_member = self.verify_membership(room_id, user_id).await?;
        if !is_member {
            return Err(anyhow::anyhow!("User is not a member of this room"));
        }

        // Delete old location for this user in this room
        location::Entity::delete_many()
            .filter(location::Column::UserId.eq(user_id))
            .filter(location::Column::RoomId.eq(room_id))
            .exec(&self.db)
            .await?;

        // Create new location
        let new_location = location::ActiveModel {
            id: Set(Uuid::new_v4()),
            user_id: Set(user_id),
            room_id: Set(room_id),
            latitude: Set(latitude),
            longitude: Set(longitude),
            timestamp: Set(Utc::now()),
        };

        let location = new_location.insert(&self.db).await?;
        Ok(location)
    }

    pub async fn get_locations(&self, room_id: Uuid) -> Result<Vec<location::Model>> {
        let locations = location::Entity::find()
            .filter(location::Column::RoomId.eq(room_id))
            .order_by_desc(location::Column::Timestamp)
            .all(&self.db)
            .await?;

        Ok(locations)
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
