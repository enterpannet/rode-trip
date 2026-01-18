use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "locations")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub user_id: Uuid,
    pub room_id: Uuid,
    #[sea_orm(column_type = "Double")]
    pub latitude: f64,
    #[sea_orm(column_type = "Double")]
    pub longitude: f64,
    pub timestamp: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::Id"
    )]
    User,
    
    #[sea_orm(
        belongs_to = "super::room::Entity",
        from = "Column::RoomId",
        to = "super::room::Column::Id"
    )]
    Room,
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl Related<super::room::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Room.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
