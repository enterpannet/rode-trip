# Road Trip Buddy - Mobile App

React Native mobile application for Road Trip Buddy using Expo and TypeScript.

## Features

- 📱 React Native with Expo SDK 54
- 🔐 HTTP-only cookie authentication
- 💬 Real-time messaging with WebSocket
- 📍 Real-time location tracking
- 📞 Voice calling with WebRTC
- 🗺️ Map integration with React Native Maps
- 🎨 Modern UI with TypeScript & StyleSheet

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Emulator (for Android development)

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000
EXPO_PUBLIC_APP_NAME=Road Trip Buddy
```

3. **Start the development server:**
```bash
npm start
```

4. **Run on platform:**
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your device

## Project Structure

```
road-trip-app/
├── app/
│   ├── screens/          # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   └── ...
│   ├── components/       # Reusable components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── services/         # API and service layer
│   │   ├── api.ts
│   │   ├── websocketService.ts
│   │   └── ...
│   ├── store/            # Zustand store
│   │   └── useAppStore.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   └── index.tsx         # Entry point
├── assets/               # Images, fonts, etc.
├── app.json              # Expo configuration
├── package.json
└── tsconfig.json
```

## Development

### Running on Device

1. Install Expo Go app on your device
2. Start development server: `npm start`
3. Scan QR code with Expo Go (iOS) or Expo Go (Android)

### Running on Simulator/Emulator

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

### Building

**Development Build:**
```bash
expo build:ios
expo build:android
```

**Production Build:**
```bash
expo build:ios --release-channel production
expo build:android --release-channel production
```

## Styling

This project uses **React Native StyleSheet** for styling.

### Using StyleSheet

```tsx
import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});

<View style={styles.container}>
  <Text style={styles.title}>Hello</Text>
</View>
```

## Environment Variables

- `EXPO_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3000)
- `EXPO_PUBLIC_WS_URL` - WebSocket URL (default: ws://localhost:3000)
- `EXPO_PUBLIC_APP_NAME` - App name (default: Road Trip Buddy)

## Testing

Make sure the backend server is running on the configured API URL.

## License

MIT License
