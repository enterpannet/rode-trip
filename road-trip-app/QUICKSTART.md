# Quick Start Guide

## Backend Setup

1. Navigate to backend directory:
```bash
cd road-trip-backend
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Edit `.env` and set:
```
DATABASE_URL=postgresql://user:password@localhost:5432/road_trip_buddy
SESSION_SECRET=your-secret-key-minimum-32-characters-long
```

4. Create PostgreSQL database:
```sql
CREATE DATABASE road_trip_buddy;
```

5. Run migrations:
```bash
cargo install sea-orm-cli
cd migrations
sea-orm-cli migrate up
```

6. Start backend server:
```bash
cd ..
cargo run
```

Backend should be running on `http://localhost:3000`

## Frontend Setup

1. Navigate to app directory:
```bash
cd road-trip-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000
EXPO_PUBLIC_APP_NAME=Road Trip Buddy
```

**For physical device testing**, replace `localhost` with your computer's IP:
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
EXPO_PUBLIC_WS_URL=ws://192.168.1.100:3000
```

4. Start the app:
```bash
npm start
```

5. Run on platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your device

## Testing the Complete Flow

1. **Start Backend:**
   ```bash
   cd road-trip-backend
   cargo run
   ```

2. **Start Frontend:**
   ```bash
   cd road-trip-app
   npm start
   ```

3. **Test Flow:**
   - Open app on device/simulator
   - Register new account
   - Create a room
   - Share room ID with another user
   - Join room from another device
   - Test real-time location tracking
   - Test real-time messaging
   - Test voice calling

## Troubleshooting

### Backend Issues

**Database connection error:**
- Make sure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists

**Port already in use:**
- Change PORT in .env
- Or kill process using port 3000

### Frontend Issues

**Can't connect to backend:**
- Make sure backend is running
- Check EXPO_PUBLIC_API_URL in .env
- For device testing, use computer's IP instead of localhost

**WebSocket connection fails:**
- Check EXPO_PUBLIC_WS_URL in .env
- Verify backend WebSocket is running
- Check firewall settings

**Location not working:**
- Grant location permissions in device settings
- Check app.json permissions configuration

## Next Steps

1. Test all features end-to-end
2. Customize UI/styling
3. Add additional features
4. Configure production build
5. Deploy backend and frontend
