# Road Trip Buddy - Frontend Setup Guide

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Expo Go app (for testing on physical device)

## Installation

1. **Install dependencies:**
```bash
cd road-trip-app
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and set:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000
EXPO_PUBLIC_APP_NAME=Road Trip Buddy
```

**Note:** For physical device testing, replace `localhost` with your computer's IP address:
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
EXPO_PUBLIC_WS_URL=ws://192.168.1.100:3000
```

3. **Start backend server first:**
Make sure the Rust backend is running on `http://localhost:3000`

## Running the App

### Development Mode

```bash
npm start
```

This will:
- Start Metro bundler
- Show QR code in terminal
- Open Expo DevTools in browser

### Platform-Specific

**iOS Simulator (macOS only):**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

**Web (limited functionality):**
```bash
npm run web
```

### Physical Device

1. Install Expo Go app:
   - iOS: App Store
   - Android: Google Play Store

2. Start development server:
```bash
npm start
```

3. Scan QR code:
   - iOS: Camera app
   - Android: Expo Go app

## Project Structure

```
road-trip-app/
├── app/
│   ├── screens/          # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── MapScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── VoiceCallScreen.tsx
│   │   └── MembersScreen.tsx
│   ├── components/       # Reusable components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── IncomingCallNotification.tsx
│   │   └── FloatingCallButton.tsx
│   ├── services/         # API and services
│   │   ├── api.ts
│   │   ├── websocketService.ts
│   │   ├── locationService.ts
│   │   ├── webrtcService.ts
│   │   └── voiceCallService.ts
│   ├── store/            # Zustand store
│   │   └── useAppStore.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   └── index.tsx         # Entry point
├── assets/               # Images, fonts, etc.
├── app.json              # Expo configuration
├── package.json
└── tsconfig.json
```

## Features

### Authentication
- ✅ Register/Login with HTTP-only cookies
- ✅ Automatic cookie management
- ✅ Session persistence

### Rooms
- ✅ Create rooms
- ✅ Join rooms
- ✅ View room members
- ✅ List user's rooms

### Real-time Messaging
- ✅ Send/receive text messages
- ✅ Message history with pagination
- ✅ Real-time updates via WebSocket

### Location Tracking
- ✅ GPS location tracking
- ✅ Real-time location updates
- ✅ Map visualization
- ✅ Member location display

### Voice Calling (Basic)
- ✅ WebRTC signaling setup
- ✅ Call initiation/accept/reject
- ⚠️ Audio streaming (requires additional setup)

## Troubleshooting

### Connection Issues

**Problem:** Can't connect to backend
**Solution:** 
- Make sure backend is running
- Check `EXPO_PUBLIC_API_URL` in `.env`
- For physical device, use your computer's IP instead of `localhost`

**Problem:** WebSocket connection fails
**Solution:**
- Check `EXPO_PUBLIC_WS_URL` in `.env`
- Ensure backend WebSocket is running on correct port
- Check firewall settings

### Location Issues

**Problem:** Location permission denied
**Solution:**
- Check app.json permissions
- Grant location permissions in device settings
- For iOS, check Info.plist permissions

### Build Issues

**Problem:** TypeScript errors
**Solution:**
```bash
npm install --save-dev @types/react @types/react-native
```

**Problem:** Metro bundler cache issues
**Solution:**
```bash
npm start -- --reset-cache
```

## Development Tips

1. **Hot Reload:** Enabled by default - save files to see changes instantly
2. **Debugging:** Use React Native Debugger or Flipper
3. **Logs:** Check terminal for console.log outputs
4. **Network:** Use Chrome DevTools Network tab for API debugging

## Next Steps

1. Test authentication flow
2. Create and join rooms
3. Test real-time messaging
4. Test location tracking
5. Test voice calling (when WebRTC is fully configured)

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

Or use EAS Build:
```bash
npm install -g eas-cli
eas build:configure
eas build --platform ios
eas build --platform android
```

## Notes

- WebRTC audio streaming requires additional native modules configuration
- For production, configure proper WebRTC STUN/TURN servers
- Test on physical devices for location and voice features
- Web version has limited functionality (no WebRTC, location restrictions)
