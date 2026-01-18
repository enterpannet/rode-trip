use sea_orm_migration::prelude::*;

#[derive(DeriveMigration)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(VoiceCall::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(VoiceCall::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(VoiceCall::RoomId).uuid().not_null())
                    .col(ColumnDef::new(VoiceCall::InitiatorId).uuid().not_null())
                    .col(
                        ColumnDef::new(VoiceCall::StartTime)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(ColumnDef::new(VoiceCall::EndTime).timestamp_with_time_zone().null())
                    .col(ColumnDef::new(VoiceCall::Status).string().not_null().default("ringing"))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_voice_calls_room_id")
                            .from(VoiceCall::Table, VoiceCall::RoomId)
                            .to(Room::Table, Room::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_voice_calls_initiator_id")
                            .from(VoiceCall::Table, VoiceCall::InitiatorId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_voice_calls_room_id")
                    .table(VoiceCall::Table)
                    .col(VoiceCall::RoomId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_voice_calls_initiator_id")
                    .table(VoiceCall::Table)
                    .col(VoiceCall::InitiatorId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_voice_calls_status")
                    .table(VoiceCall::Table)
                    .col(VoiceCall::Status)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(VoiceCall::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum VoiceCall {
    Table,
    Id,
    RoomId,
    InitiatorId,
    StartTime,
    EndTime,
    Status,
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
