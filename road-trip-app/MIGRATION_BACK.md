# Migration Back to React Native + Expo

## ❌ Issue with LynxJS

LynxJS package `@lynx-js/react` is not available in npm registry, causing installation errors.

## ✅ Solution: React Native + Expo + NativeWind (Tailwind CSS)

We've migrated back to React Native + Expo but kept Tailwind CSS through **NativeWind v4**.

### Why NativeWind?

- ✅ Official Tailwind CSS support for React Native
- ✅ Works seamlessly with Expo
- ✅ Full Tailwind utility classes support
- ✅ Type-safe with TypeScript
- ✅ Active development and support

## 📦 Installed Packages

### Core
- `expo` ~54.0.0
- `react` 18.3.1
- `react-native` 0.76.0

### Navigation
- `@react-navigation/native`
- `@react-navigation/stack`
- `@react-navigation/bottom-tabs`

### Tailwind CSS
- `nativewind` ^4.0.1
- `tailwindcss` ^3.4.0

### Other
- `zustand` - State management
- `axios` - HTTP client
- `socket.io-client` - WebSocket
- `react-native-webrtc` - WebRTC

## 📁 Configuration Files

1. **tailwind.config.js** - Tailwind config with NativeWind preset
2. **babel.config.js** - Babel config with NativeWind plugin
3. **global.css** - Tailwind directives
4. **app/index.tsx** - Entry point with React Navigation

## 🎨 Using Tailwind CSS

### Components

```tsx
import { View, Text, TouchableOpacity } from 'react-native';

// Using Tailwind classes
<View className="flex-1 bg-gray-100 p-4">
  <Text className="text-2xl font-bold text-gray-800">Hello</Text>
  <TouchableOpacity className="bg-primary py-3 px-6 rounded-lg">
    <Text className="text-white font-semibold">Click</Text>
  </TouchableOpacity>
</View>
```

### Custom Colors

```tsx
// Using custom colors from tailwind.config.js
<View className="bg-primary">Primary</View>
<View className="bg-secondary">Secondary</View>
<View className="bg-danger">Danger</View>
<View className="bg-success">Success</View>
```

## 📝 Components Converted

- ✅ Button.tsx - Using Tailwind classes
- ✅ Input.tsx - Using Tailwind classes
- ✅ LoginScreen.tsx - Ready for Tailwind conversion
- ✅ RegisterScreen.tsx - Ready for Tailwind conversion

## ⚠️ Screens to Convert

- [ ] HomeScreen
- [ ] MapScreen
- [ ] ChatScreen
- [ ] VoiceCallScreen
- [ ] MembersScreen

## 🚀 Installation

```bash
npm install
```

## 📚 Resources

- [NativeWind v4 Docs](https://www.nativewind.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## ✅ Benefits

1. **Stable Ecosystem** - React Native + Expo has mature ecosystem
2. **Tailwind CSS** - Full Tailwind support via NativeWind
3. **Type Safety** - TypeScript support
4. **Active Development** - Regular updates and bug fixes
5. **Community Support** - Large community and resources
