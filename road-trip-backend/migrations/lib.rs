pub use sea_orm_migration::prelude::*;

mod m20240101_000001_create_users_table;
mod m20240101_000002_create_sessions_table;
mod m20240101_000003_create_rooms_table;
mod m20240101_000004_create_room_members_table;
mod m20240101_000005_create_messages_table;
mod m20240101_000006_create_locations_table;
mod m20240101_000007_create_voice_calls_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20240101_000001_create_users_table::Migration),
            Box::new(m20240101_000002_create_sessions_table::Migration),
            Box::new(m20240101_000003_create_rooms_table::Migration),
            Box::new(m20240101_000004_create_room_members_table::Migration),
            Box::new(m20240101_000005_create_messages_table::Migration),
            Box::new(m20240101_000006_create_locations_table::Migration),
            Box::new(m20240101_000007_create_voice_calls_table::Migration),
        ]
    }
}
