use sea_orm_migration::prelude::*;

#[derive(DeriveMigration)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(RoomMember::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(RoomMember::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(RoomMember::RoomId).uuid().not_null())
                    .col(ColumnDef::new(RoomMember::UserId).uuid().not_null())
                    .col(
                        ColumnDef::new(RoomMember::JoinedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_room_members_room_id")
                            .from(RoomMember::Table, RoomMember::RoomId)
                            .to(Room::Table, Room::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_room_members_user_id")
                            .from(RoomMember::Table, RoomMember::UserId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_room_members_room_id")
                    .table(RoomMember::Table)
                    .col(RoomMember::RoomId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_room_members_user_id")
                    .table(RoomMember::Table)
                    .col(RoomMember::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_room_members_unique")
                    .table(RoomMember::Table)
                    .col(RoomMember::RoomId)
                    .col(RoomMember::UserId)
                    .unique()
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(RoomMember::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum RoomMember {
    Table,
    Id,
    RoomId,
    UserId,
    JoinedAt,
}

#[derive(DeriveIden)]
enum Room {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum User {
    Table,
    Id,
}
