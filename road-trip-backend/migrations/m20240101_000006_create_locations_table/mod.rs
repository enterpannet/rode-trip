use sea_orm_migration::prelude::*;

#[derive(DeriveMigration)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Location::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Location::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Location::UserId).uuid().not_null())
                    .col(ColumnDef::new(Location::RoomId).uuid().not_null())
                    .col(ColumnDef::new(Location::Latitude).double().not_null())
                    .col(ColumnDef::new(Location::Longitude).double().not_null())
                    .col(
                        ColumnDef::new(Location::Timestamp)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_locations_user_id")
                            .from(Location::Table, Location::UserId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_locations_room_id")
                            .from(Location::Table, Location::RoomId)
                            .to(Room::Table, Room::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_locations_user_id")
                    .table(Location::Table)
                    .col(Location::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_locations_room_id")
                    .table(Location::Table)
                    .col(Location::RoomId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_locations_timestamp")
                    .table(Location::Table)
                    .col(Location::Timestamp)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Location::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Location {
    Table,
    Id,
    UserId,
    RoomId,
    Latitude,
    Longitude,
    Timestamp,
}

#[derive(DeriveIden)]
enum User {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Room {
    Table,
    Id,
}
