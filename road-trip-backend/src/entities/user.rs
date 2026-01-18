use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub name: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub avatar: Option<String>,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::room_member::Entity")]
    RoomMembers,
    
    #[sea_orm(has_many = "super::message::Entity")]
    Messages,
    
    #[sea_orm(has_many = "super::location::Entity")]
    Locations,
    
    #[sea_orm(has_many = "super::voice_call::Entity")]
    VoiceCalls,
    
    #[sea_orm(has_many = "super::session::Entity")]
    Sessions,
}

impl Related<super::room_member::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RoomMembers.def()
    }
}

impl Related<super::message::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Messages.def()
    }
}

impl Related<super::location::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Locations.def()
    }
}

impl Related<super::voice_call::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::VoiceCalls.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
