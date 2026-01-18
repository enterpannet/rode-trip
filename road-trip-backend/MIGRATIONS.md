# Database Migrations Guide

This document explains how to work with SeaORM migrations for the Road Trip Buddy backend.

## Migration Structure

The migrations are located in the `migrations/` directory and are organized as follows:

```
migrations/
├── lib.rs                                    # Migration registry
├── m20240101_000001_create_users_table/     # Users table
├── m20240101_000002_create_sessions_table/  # Sessions table
├── m20240101_000003_create_rooms_table/     # Rooms table
├── m20240101_000004_create_room_members_table/  # Room members (join table)
├── m20240101_000005_create_messages_table/  # Messages table
├── m20240101_000006_create_locations_table/ # Locations table
└── m20240101_000007_create_voice_calls_table/ # Voice calls table
```

## Running Migrations

### Option 1: Using sea-orm-cli (Recommended)

1. Install sea-orm-cli:
```bash
cargo install sea-orm-cli
```

2. Run migrations:
```bash
sea-orm-cli migrate up
```

3. Rollback last migration:
```bash
sea-orm-cli migrate down
```

4. Check migration status:
```bash
sea-orm-cli migrate status
```

### Option 2: Programmatically (In Code)

Uncomment the migration line in `src/main.rs`:

```rust
// Run migrations (optional - comment out in production if using migration CLI)
use migrations::Migrator;
Migrator::up(&db, None).await?;
```

**Note:** This approach runs migrations on every server start. For production, use sea-orm-cli instead.

## Migration Order

Migrations run in this order:

1. **Users** - Base user table (required for all other tables)
2. **Sessions** - Authentication sessions (depends on Users)
3. **Rooms** - Chat/location rooms (depends on Users)
4. **Room Members** - Room membership join table (depends on Rooms and Users)
5. **Messages** - Chat messages (depends on Rooms and Users)
6. **Locations** - Location tracking (depends on Rooms and Users)
7. **Voice Calls** - Voice call sessions (depends on Rooms and Users)

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `name` (String)
- `email` (String, Unique)
- `password_hash` (String, Argon2 hash)
- `avatar` (String, Optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Sessions Table
- `id` (UUID, Primary Key)
- `session_token` (String, Unique)
- `user_id` (UUID, Foreign Key -> Users)
- `expires_at` (Timestamp)
- `created_at` (Timestamp)

### Rooms Table
- `id` (UUID, Primary Key)
- `name` (String)
- `description` (String, Optional)
- `created_by` (UUID, Foreign Key -> Users)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `is_active` (Boolean)

### Room Members Table (Join Table)
- `id` (UUID, Primary Key)
- `room_id` (UUID, Foreign Key -> Rooms)
- `user_id` (UUID, Foreign Key -> Users)
- `joined_at` (Timestamp)
- Unique constraint on (room_id, user_id)

### Messages Table
- `id` (UUID, Primary Key)
- `room_id` (UUID, Foreign Key -> Rooms)
- `user_id` (UUID, Foreign Key -> Users)
- `text` (Text, Optional)
- `image_url` (String, Optional)
- `message_type` (String, Default: "text")
- `created_at` (Timestamp)

### Locations Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> Users)
- `room_id` (UUID, Foreign Key -> Rooms)
- `latitude` (Double)
- `longitude` (Double)
- `timestamp` (Timestamp)

### Voice Calls Table
- `id` (UUID, Primary Key)
- `room_id` (UUID, Foreign Key -> Rooms)
- `initiator_id` (UUID, Foreign Key -> Users)
- `start_time` (Timestamp)
- `end_time` (Timestamp, Optional)
- `status` (String, Default: "ringing")

## Creating New Migrations

To create a new migration:

```bash
sea-orm-cli migrate generate <migration_name>
```

This will create a new migration file in the `migrations/` directory. Remember to:

1. Add the migration to `migrations/lib.rs`
2. Implement the `up()` and `down()` methods
3. Test the migration on a development database first

## Notes

- All foreign keys use CASCADE on delete
- Indexes are created for frequently queried columns
- Timestamps use `timestamp_with_time_zone` for PostgreSQL
- UUIDs are used for all primary keys
