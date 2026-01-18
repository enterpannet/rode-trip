# Database Migrations

This directory contains SeaORM migrations for the Road Trip Buddy database schema.

## Creating Migrations

To create a new migration using SeaORM CLI:

```bash
sea-orm-cli migrate generate <migration_name>
```

## Running Migrations

To run all pending migrations:

```bash
sea-orm-cli migrate up
```

To rollback the last migration:

```bash
sea-orm-cli migrate down
```

## Migration Files

Migrations should be placed in numbered directories:
- `m20240101_000001_create_users_table/`
- `m20240101_000002_create_rooms_table/`
- etc.

Each migration directory should contain:
- `mod.rs` - Migration module
- `up.sql` - SQL for applying migration
- `down.sql` - SQL for rolling back migration
