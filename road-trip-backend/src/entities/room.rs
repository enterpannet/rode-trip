use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "rooms")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_by: Uuid,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub is_active: bool,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::CreatedBy",
        to = "super::user::Column::Id"
    )]
    Creator,
    
    #[sea_orm(has_many = "super::room_member::Entity")]
    RoomMembers,
    
    #[sea_orm(has_many = "super::message::Entity")]
    Messages,
    
    #[sea_orm(has_many = "super::location::Entity")]
    Locations,
    
    #[sea_orm(has_many = "super::voice_call::Entity")]
    VoiceCalls,
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Creator.def()
    }
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
