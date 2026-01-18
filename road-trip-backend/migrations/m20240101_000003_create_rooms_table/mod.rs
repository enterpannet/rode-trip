use sea_orm_migration::prelude::*;

#[derive(DeriveMigration)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Room::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Room::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Room::Name).string().not_null())
                    .col(ColumnDef::new(Room::Description).string().null())
                    .col(ColumnDef::new(Room::CreatedBy).uuid().not_null())
                    .col(
                        ColumnDef::new(Room::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Room::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Room::IsActive).boolean().not_null().default(false))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_rooms_created_by")
                            .from(Room::Table, Room::CreatedBy)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_rooms_created_by")
                    .table(Room::Table)
                    .col(Room::CreatedBy)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Room::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Room {
    Table,
    Id,
    Name,
    Description,
    CreatedBy,
    CreatedAt,
    UpdatedAt,
    IsActive,
}

#[derive(DeriveIden)]
enum User {
    Table,
    Id,
}
