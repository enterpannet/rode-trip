use sea_orm_migration::prelude::*;

#[derive(DeriveMigration)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Message::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Message::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Message::RoomId).uuid().not_null())
                    .col(ColumnDef::new(Message::UserId).uuid().not_null())
                    .col(ColumnDef::new(Message::Text).text().null())
                    .col(ColumnDef::new(Message::ImageUrl).string().null())
                    .col(ColumnDef::new(Message::MessageType).string().not_null().default("text"))
                    .col(
                        ColumnDef::new(Message::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_messages_room_id")
                            .from(Message::Table, Message::RoomId)
                            .to(Room::Table, Room::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_messages_user_id")
                            .from(Message::Table, Message::UserId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_messages_room_id")
                    .table(Message::Table)
                    .col(Message::RoomId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_messages_user_id")
                    .table(Message::Table)
                    .col(Message::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_messages_created_at")
                    .table(Message::Table)
                    .col(Message::CreatedAt)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Message::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Message {
    Table,
    Id,
    RoomId,
    UserId,
    Text,
    ImageUrl,
    MessageType,
    CreatedAt,
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
