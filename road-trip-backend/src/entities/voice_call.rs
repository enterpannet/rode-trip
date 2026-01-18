use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum CallStatus {
    #[serde(rename = "ringing")]
    Ringing,
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "ended")]
    Ended,
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "voice_calls")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub room_id: Uuid,
    pub initiator_id: Uuid,
    pub start_time: DateTimeUtc,
    pub end_time: Option<DateTimeUtc>,
    pub status: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::room::Entity",
        from = "Column::RoomId",
        to = "super::room::Column::Id"
    )]
    Room,
    
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::InitiatorId",
        to = "super::user::Column::Id"
    )]
    Initiator,
}

impl Related<super::room::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Room.def()
    }
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Initiator.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
