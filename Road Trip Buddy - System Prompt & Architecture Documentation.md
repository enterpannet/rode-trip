# Road Trip Buddy - System Prompt & Architecture Documentation

## 📋 System Overview

Road Trip Buddy is a comprehensive mobile application designed for coordinating group road trips with real-time location tracking, instant messaging, and peer-to-peer voice calling. The system consists of a React Native frontend and Rust backend with WebSocket support for real-time communication.

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (Frontend)                     │
│              React Native + Expo + TypeScript               │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Screens    │  │  Components  │  │   Services   │      │
│  │  - Login     │  │  - Button    │  │  - API       │      │
│  │  - Home      │  │  - Input     │  │  - WebSocket │      │
│  │  - Map       │  │  - Notif     │  │  - WebRTC    │      │
│  │  - Chat      │  │  - FloatBtn  │  │  - Location  │      │
│  │  - VoiceCall │  └──────────────┘  └──────────────┘      │
│  └──────────────┘                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                 HTTP + WebSocket
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Backend Server (API)                        │
│              Rust + Axum + Actix-Web                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Handlers    │  │   Services   │  │   Entities   │      │
│  │  - Auth      │  │  - WebSocket │  │  - SeaORM    │      │
│  │  - Room      │  │  - Signaling │  │  - PostgreSQL│      │
│  │  - Message   │  │              │  │              │      │
│  │  - Location  │  └──────────────┘  └──────────────┘      │
│  └──────────────┘                                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Routes     │  │  Middleware  │                        │
│  │  - /auth     │  │  - Auth Cookie│                       │
│  │  - /rooms    │  │  - CORS      │                        │
│  │  - /messages │  │              │                        │
│  │  - /location │  └──────────────┘                        │
│  └──────────────┘                                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 📱 Frontend Architecture

### Technology Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Zustand
- **Navigation**: React Navigation
- **Maps**: React Native Maps
- **WebRTC**: react-native-webrtc
- **Audio**: expo-av
- **HTTP Client**: Axios/Fetch
- **WebSocket**: Socket.io Client

### Directory Structure
```
road-trip-app/
├── app/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── MapScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── VoiceCallScreen.tsx
│   │   └── MembersScreen.tsx
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── IncomingCallNotification.tsx
│   │   └── FloatingCallButton.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── websocketService.ts
│   │   ├── locationService.ts
│   │   ├── webrtcService.ts
│   │   └── voiceCallService.ts
│   ├── store/
│   │   └── useAppStore.ts
│   ├── types/
│   │   └── index.ts
│   └── index.tsx
├── app.json
├── package.json
└── tsconfig.json
```

### Key Services

#### 1. API Service (`api.ts`)
- Handles all HTTP requests to backend
- Manages HTTP-only cookies for authentication
- Automatically includes cookies in requests
- Provides methods for:
  - User registration/login
  - Room management
  - Message operations
  - Location updates

#### 2. WebSocket Service (`websocketService.ts`)
- Manages real-time communication
- Handles connection lifecycle
- Emits and receives events:
  - Location updates
  - New messages
  - User join/leave
  - Voice call events

#### 3. Location Service (`locationService.ts`)
- Requests GPS permissions
- Gets current location
- Tracks location changes
- Sends updates to backend

#### 4. WebRTC Service (`webrtcService.ts`)
- Creates peer connections
- Manages audio streams
- Handles ICE candidates
- Provides mute/unmute functionality

#### 5. Voice Call Service (`voiceCallService.ts`)
- High-level call management
- Initiates/accepts/rejects calls
- Manages call state
- Tracks call duration

#### 6. Zustand Store (`useAppStore.ts`)
- Global state management
- Stores:
  - Current user
  - Current room
  - Messages
  - Locations
  - Call state

### Screen Components

#### LoginScreen
- Email/password input
- Login button
- Link to register
- Error handling

#### RegisterScreen
- Name/email/password input
- Confirm password
- Register button
- Link to login

#### HomeScreen
- List of user's rooms
- Create room button
- Join room button
- Room details display

#### MapScreen
- Google Maps integration
- Real-time member locations
- Location markers
- Zoom/pan controls

#### ChatScreen
- Message list
- Message input
- Image picker
- Send button
- Real-time message updates

#### VoiceCallScreen
- Caller information
- Accept/Reject buttons
- Mute/Unmute button
- End call button
- Call duration display

#### MembersScreen
- List of room members
- Member details
- Member status

---

## 🖥️ Backend Architecture

### Technology Stack
- **Runtime**: Rust
- **Framework**: Axum or Actix-Web
- **Language**: Rust
- **Real-time**: Tokio + WebSocket (tungstenite/axum-websocket)
- **ORM**: SeaORM
- **Database**: PostgreSQL
- **Authentication**: HTTP-only cookies + argon2
- **Session Management**: Cookie-based sessions
- **File Upload**: Multipart form handling

### Directory Structure
```
road-trip-backend/
├── src/
│   ├── handlers/
│   │   ├── auth.rs
│   │   ├── room.rs
│   │   ├── message.rs
│   │   └── location.rs
│   ├── middleware/
│   │   ├── auth.rs
│   │   └── cors.rs
│   ├── entities/
│   │   ├── user.rs
│   │   ├── room.rs
│   │   ├── message.rs
│   │   ├── location.rs
│   │   └── voice_call.rs
│   ├── services/
│   │   ├── auth_service.rs
│   │   ├── websocket.rs
│   │   └── voice_call_signaling.rs
│   ├── routes/
│   │   └── mod.rs
│   ├── utils/
│   │   ├── cookie.rs
│   │   └── password.rs
│   ├── config/
│   │   └── database.rs
│   └── main.rs
├── migrations/
│   └── (SeaORM migration files)
├── Cargo.toml
└── .env.example
```

### Core Components

#### Handlers

**auth.rs**
- `register()` - User registration with password hashing
- `login()` - User login, sets HTTP-only cookie
- `logout()` - Clears authentication cookie
- `get_current_user()` - Get authenticated user from cookie

**room.rs**
- `create_room()` - Create new room
- `get_rooms()` - Get user's rooms
- `join_room()` - Join existing room
- `get_room_members()` - Get room members

**message.rs**
- `get_messages()` - Retrieve messages with pagination
- `send_message()` - Send new message
- `upload_image()` - Upload image via multipart

**location.rs**
- `update_location()` - Update user location
- `get_locations()` - Get all locations in room

#### Entities (SeaORM Models)

**Database Entities**
- `User` - User entity with password hash
- `Room` - Room entity with relationships
- `RoomMember` - Many-to-many relationship
- `Message` - Message entity with room/user relations
- `Location` - Location tracking entity
- `VoiceCall` - Voice call entity
- CRUD operations via SeaORM:
  - Users: create, read, update
  - Rooms: create, join, leave, get members
  - Messages: add, retrieve with pagination
  - Locations: update, get
  - Voice Calls: create, update, delete

#### Services

**auth_service.rs**
- Password hashing with argon2 (memory-hard password hashing)
- Session token generation
- Cookie management (HTTP-only, Secure, SameSite)
- Session validation

**websocket.rs**
- WebSocket server setup with tokio
- Event handlers for:
  - User join/leave
  - Location updates
  - Message broadcasting
  - Typing indicators
  - Voice call events

**voice_call_signaling.rs**
- WebRTC signaling handlers
- Events:
  - `voice-call-initiate`
  - `voice-call-accept`
  - `voice-call-reject`
  - `voice-call-end`
  - `ice-candidate`
  - `voice-offer`
  - `voice-answer`

#### Middleware

**auth.rs**
- HTTP-only cookie extraction
- Session validation
- User authentication middleware
- Protected route guard

---

## 🔄 Data Flow

### Authentication Flow

```
User Input (Email, Password)
    ↓
Frontend: POST /auth/register or /auth/login
    ↓
Backend: Validate credentials
    ↓
Backend: Hash password (argon2)
    ↓
Backend: Generate session token
    ↓
Backend: Set HTTP-only cookie with session token
    ↓
Backend: Return user data (no token in response body)
    ↓
Browser: Automatically stores cookie
    ↓
Frontend: Subsequent requests automatically include cookie
    ↓
Backend: Validates cookie on each request
```

### Room Management Flow

```
User creates/joins room
    ↓
Frontend: POST /rooms or POST /rooms/join
    ↓
Backend: Validate user and room
    ↓
Backend: Update database
    ↓
Backend: Emit WebSocket event
    ↓
Frontend: Receive update via WebSocket
    ↓
Frontend: Update UI with room data
```

### Real-time Location Flow

```
User's location changes
    ↓
Frontend: Get GPS coordinates
    ↓
Frontend: POST /rooms/:id/location
    ↓
Backend: Update location in database
    ↓
Backend: Emit WebSocket event to room
    ↓
All users in room: Receive location update
    ↓
Frontend: Update map markers
```

### Voice Call Flow

```
User A initiates call
    ↓
Frontend: Emit 'voice-call-initiate'
    ↓
Backend: Broadcast to room
    ↓
User B receives notification
    ↓
User B accepts call
    ↓
Frontend: Create WebRTC peer connection
    ↓
Exchange SDP offer/answer
    ↓
Exchange ICE candidates
    ↓
Audio connection established
    ↓
Users can communicate
    ↓
Either user ends call
    ↓
Cleanup and disconnect
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (returns HTTP-only cookie)
- `POST /api/auth/login` - Login user (returns HTTP-only cookie)
- `POST /api/auth/logout` - Logout user (clears cookie)
- `GET /api/auth/me` - Get current user (requires cookie)

### Rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms` - Get user's rooms
- `POST /api/rooms/join` - Join room
- `GET /api/rooms/:roomId/members` - Get room members

### Messages
- `GET /api/rooms/:roomId/messages` - Get messages
- `POST /api/rooms/:roomId/messages` - Send message

### Location
- `POST /api/rooms/:roomId/location` - Update location
- `GET /api/rooms/:roomId/locations` - Get all locations

### Health
- `GET /api/health` - Server health check

---

## 🔌 WebSocket Events

### Client → Server

**Room Events**
- `join-room` - Join room for real-time updates
- `leave-room` - Leave room

**Message Events**
- `new-message` - Send text message
- `image-message` - Send image message
- `typing` - Send typing indicator

**Location Events**
- `location-update` - Send location update

**Voice Call Events**
- `voice-call-initiate` - Initiate call
- `voice-call-accept` - Accept call
- `voice-call-reject` - Reject call
- `voice-call-end` - End call

**WebRTC Signaling**
- `ice-candidate` - Send ICE candidate
- `voice-offer` - Send SDP offer
- `voice-answer` - Send SDP answer

### Server → Client

**Room Events**
- `user-joined` - User joined room
- `user-left` - User left room

**Message Events**
- `message` - New message received
- `user-typing` - User is typing

**Location Events**
- `location-update` - Location update received

**Voice Call Events**
- `voice-call-incoming` - Incoming call
- `voice-call-accepted` - Call accepted
- `voice-call-rejected` - Call rejected
- `voice-call-ended` - Call ended

**WebRTC Signaling**
- `ice-candidate` - Receive ICE candidate
- `voice-offer` - Receive SDP offer
- `voice-answer` - Receive SDP answer

---

## 🔐 Security

### Authentication
- HTTP-only cookies with session tokens
- Secure flag enabled in production (HTTPS only)
- SameSite=Strict to prevent CSRF attacks
- Session expiration (7 days)
- Argon2 password hashing (memory-hard, recommended settings)
- Cookie verification on protected routes
- Automatic cookie handling by browser

### Authorization
- Room membership verification
- User-specific data access
- Ownership checks for operations

### Data Protection
- HTTPS/WSS in production
- DTLS-SRTP for WebRTC audio
- P2P audio (not recorded on server)
- Automatic call cleanup

### Input Validation
- Email format validation
- Password strength requirements
- Required field checks
- Type validation

---

## 🗄️ Data Models

### User (SeaORM Entity)
```rust
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub password_hash: String,  // argon2 hash
    pub avatar: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
```

### Room (SeaORM Entity)
```rust
pub struct Room {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_by: Uuid,  // Foreign key to User
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
}
```

### RoomMember (SeaORM Entity - Join Table)
```rust
pub struct RoomMember {
    pub id: Uuid,
    pub room_id: Uuid,
    pub user_id: Uuid,
    pub joined_at: DateTime<Utc>,
}
```

### Message (SeaORM Entity)
```rust
pub struct Message {
    pub id: Uuid,
    pub room_id: Uuid,
    pub user_id: Uuid,
    pub text: Option<String>,
    pub image_url: Option<String>,
    pub message_type: MessageType,  // Enum: Text | Image
    pub created_at: DateTime<Utc>,
}
```

### Location (SeaORM Entity)
```rust
pub struct Location {
    pub id: Uuid,
    pub user_id: Uuid,
    pub room_id: Uuid,
    pub latitude: f64,
    pub longitude: f64,
    pub timestamp: DateTime<Utc>,
}
```

### VoiceCall (SeaORM Entity)
```rust
pub struct VoiceCall {
    pub id: Uuid,
    pub room_id: Uuid,
    pub initiator_id: Uuid,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub status: CallStatus,  // Enum: Ringing | Active | Ended
}
```

### Session (Session Storage)
```rust
pub struct Session {
    pub session_token: String,
    pub user_id: Uuid,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}
```

---

## 🚀 Deployment

### Frontend Deployment
- Build: `pnpm build`
- Deploy to: Expo, TestFlight, Google Play
- Environment: `.env.local`

### Backend Deployment
- Build: `cargo build --release`
- Deploy to: Railway, Render, Fly.io, AWS ECS, DigitalOcean
- Environment: `.env`
- Database: PostgreSQL (managed service or self-hosted)

### Environment Variables

**Frontend (.env.local)**
```
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_WS_URL=wss://api.example.com
EXPO_PUBLIC_APP_NAME=Road Trip Buddy
```

**Backend (.env)**
```
PORT=3000
RUST_LOG=info
DATABASE_URL=postgresql://user:password@localhost:5432/road_trip_buddy
SESSION_SECRET=your-secret-key-min-32-chars
CORS_ORIGIN=https://example.com
COOKIE_DOMAIN=.example.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=Strict
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

---

## 📊 Performance Metrics

### Target Metrics
- API Response Time: < 200ms
- WebSocket Latency: < 100ms
- Voice Call Connection: < 5 seconds
- Audio Latency: < 150ms
- App Load Time: < 3 seconds

### Optimization Strategies
- Message pagination with database cursors
- Location update throttling
- Image compression
- Database connection pooling (SeaORM connection pool)
- Query optimization with indexes
- Caching strategies (Redis for session storage optional)
- Async database operations with tokio

---

## 🧪 Testing

### Frontend Testing
- Unit tests with Jest
- Component tests with React Testing Library
- E2E tests with Detox
- Manual testing on devices

### Backend Testing
- Unit tests with Rust built-in test framework
- Integration tests with tokio-test
- Load testing with k6 or wrk
- API testing with Postman or curl

---

## 🐛 Error Handling

### Frontend
- Try-catch blocks
- Error boundaries
- User-friendly error messages
- Retry mechanisms
- Offline detection

### Backend
- Error handling with Result types
- Error middleware with proper status codes
- Validation errors (serde validation)
- Authentication errors (cookie validation)
- Authorization errors (permission checks)
- Database errors (SeaORM error handling)
- Server errors with proper error chains

---

## 📝 Logging

### Frontend
- Console logs (development)
- Sentry integration (production)
- User action tracking
- Error reporting

### Backend
- Tracing (tracing-subscriber) for structured logging
- Request logging with middleware
- Error logging with error chains
- Performance monitoring with metrics
- Audit trails in database

---

## 🔄 State Management

### Zustand Store Structure
```typescript
{
  user: User | null
  currentRoom: Room | null
  rooms: Room[]
  messages: Message[]
  locations: Location[]
  callState: VoiceCallState | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser()
  setCurrentRoom()
  addMessage()
  updateLocation()
  setCallState()
}
```

---

## 🎯 Key Features

### 1. User Management
- Registration with email verification
- Login with HTTP-only cookies
- Profile management
- Secure session-based authentication

### 2. Room Management
- Create rooms
- Join existing rooms
- Leave rooms
- View room members
- Room descriptions

### 3. Real-time Messaging
- Text messages
- Image sharing
- Message history
- Typing indicators
- Real-time delivery

### 4. Location Tracking
- GPS integration
- Real-time location updates
- Map visualization
- Member location display
- Location history

### 5. Voice Calling
- Peer-to-peer calls
- WebRTC technology
- Audio quality optimization
- Mute/unmute functionality
- Call duration tracking
- Incoming call notifications

---

## 🔧 Configuration

### App Configuration (app.json)
```json
{
  "expo": {
    "name": "Road Trip Buddy",
    "slug": "road-trip-buddy",
    "version": "1.0.0",
    "plugins": [
      ["expo-location"],
      ["expo-av"],
      ["react-native-webrtc"]
    ],
    "permissions": [
      "LOCATION",
      "CAMERA",
      "MICROPHONE"
    ]
  }
}
```

### Server Configuration
```rust
// Config structure
pub struct Config {
    pub port: u16,
    pub database_url: String,
    pub session_secret: String,
    pub cors_origin: String,
    pub cookie_domain: Option<String>,
    pub cookie_secure: bool,
    pub cookie_same_site: SameSite,
}
```

---

## 📚 Documentation

- **QUICKSTART.md** - Quick start guide
- **WEBRTC_GUIDE.md** - WebRTC implementation details
- **WEBRTC_TESTING.md** - Testing procedures
- **README.md** - Project overview
- **API_DOCS.md** - API documentation

---

## 🚦 Development Workflow

### Setup
1. Clone repository
2. Install Rust (rustup)
3. Install PostgreSQL
4. Run database migrations
5. Configure environment variables
6. Start backend server (`cargo run`)
7. Start frontend app

### Development
1. Create feature branch
2. Implement feature
3. Write tests
4. Create pull request
5. Code review
6. Merge to main

### Deployment
1. Create release branch
2. Update version in Cargo.toml
3. Build release artifacts (`cargo build --release`)
4. Run database migrations
5. Deploy to staging
6. Test in staging
7. Deploy to production

---

## 📞 Support & Troubleshooting

### Common Issues
- WebSocket connection failed
- Location permission denied
- Microphone permission denied
- Audio not working
- Map not displaying

### Debug Mode
- Enable console logging
- Use React DevTools
- Use Network tab
- Check WebSocket frames
- Monitor server logs

---

## 🎓 Learning Resources

- React Native Documentation
- Expo Documentation
- Rust Book
- Axum Framework Guide
- SeaORM Documentation
- PostgreSQL Documentation
- Socket.io Documentation
- WebRTC API Reference
- TypeScript Handbook

---

## 📄 License

MIT License - See LICENSE file for details

---

**Version:** 1.0.0  
**Last Updated:** January 2024  
**Status:** Production Ready
