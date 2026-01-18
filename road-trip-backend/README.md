# Road Trip Buddy Backend

Rust backend for Road Trip Buddy application using Axum, SeaORM, PostgreSQL, and HTTP-only cookie authentication.

## Features

- 🦀 Rust + Axum web framework
- 🗄️ PostgreSQL database with SeaORM
- 🔐 HTTP-only cookie authentication with Argon2 password hashing
- 🔒 Secure session management
- 🌐 CORS support
- 📝 Structured logging with tracing
- ⚡ Async/await support with Tokio

## Prerequisites

- Rust (latest stable version)
- PostgreSQL 12+
- Cargo (comes with Rust)

## Setup

1. Clone the repository

2. Copy environment file:
```bash
cp .env.example .env
```

3. Edit `.env` and configure:
   - `DATABASE_URL` - PostgreSQL connection string
   - `SESSION_SECRET` - Random secret key (minimum 32 characters)
   - `CORS_ORIGIN` - Allowed origins for CORS

4. Create PostgreSQL database:
```sql
CREATE DATABASE road_trip_buddy;
```

5. Install sea-orm-cli (if not already installed):
```bash
cargo install sea-orm-cli
```

6. Run migrations:
```bash
cd migrations
sea-orm-cli migrate up
```

Or run migrations programmatically by uncommenting the migration line in `src/main.rs`.

6. Build and run:
```bash
cargo run
```

The server will start on `http://localhost:3000` (or your configured port).

## Development

Run in development mode:
```bash
cargo run
```

Run with watch mode (requires cargo-watch):
```bash
cargo install cargo-watch
cargo watch -x run
```

## Project Structure

```
road-trip-backend/
├── src/
│   ├── config/          # Configuration
│   ├── entities/        # SeaORM entities
│   ├── handlers/        # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── routes/          # Route definitions
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── main.rs          # Entry point
├── migrations/          # Database migrations
├── Cargo.toml          # Dependencies
└── .env.example        # Environment template
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user (protected)
- `GET /api/auth/me` - Get current user (protected)

### Health
- `GET /api/health` - Health check

## Database Schema

See `src/entities/` for all entity definitions:
- `User` - User accounts
- `Room` - Chat/location rooms
- `RoomMember` - Room membership (many-to-many)
- `Message` - Chat messages
- `Location` - User locations
- `VoiceCall` - Voice call sessions
- `Session` - Authentication sessions

## Testing

Run tests:
```bash
cargo test
```

## Testing

See [API_TESTS.md](./API_TESTS.md) for complete API testing guide.

### Quick Test

**Using curl:**
```bash
./test-api.sh
```

**Using PowerShell:**
```powershell
.\test-api.ps1
```

**Using Postman:**
1. Import `postman/Road Trip Buddy API.postman_collection.json`
2. Set `base_url` variable to `http://localhost:3000`
3. Run requests

**Using VS Code REST Client:**
1. Install "REST Client" extension
2. Open `.http` file
3. Click "Send Request" above each request

## License

MIT License
