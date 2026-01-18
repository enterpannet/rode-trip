# Migration to LynxJS - Complete Guide

## Overview

This project has been migrated from React Native + Expo to LynxJS framework.

## Key Changes

### 1. Component Syntax

**Before (React Native):**
```tsx
import { View, Text, Image } from 'react-native';

<View style={styles.container}>
  <Text>Hello World</Text>
</View>
```

**After (LynxJS):**
```tsx
<view className="container">
  <text>Hello World</text>
</view>
```

### 2. Styling

**Before (React Native):**
```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});
```

**After (LynxJS):**
```css
/* Component.css */
.container {
  flex: 1;
  background-color: #F5F5F5;
}
```

### 3. Event Handlers

**Before (React Native):**
```tsx
<TouchableOpacity onPress={handlePress}>
  <Text>Click me</Text>
</TouchableOpacity>
```

**After (LynxJS):**
```tsx
<view bindtap={handlePress}>
  <text>Click me</text>
</view>
```

### 4. Navigation

**Before (React Native):**
```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

<NavigationContainer>
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} />
  </Stack.Navigator>
</NavigationContainer>
```

**After (LynxJS):**
```tsx
// Custom state-based navigation
const [currentScreen, setCurrentScreen] = useState('Home');

const navigate = (screen: string) => {
  setCurrentScreen(screen);
};

// Render based on currentScreen
{currentScreen === 'Home' && <HomeScreen navigation={{ navigate }} />}
```

### 5. Lists

**Before (React Native):**
```tsx
<FlatList
  data={items}
  renderItem={({ item }) => <Item data={item} />}
  keyExtractor={(item) => item.id}
/>
```

**After (LynxJS):**
```tsx
<list>
  {items.map((item) => (
    <list-item key={item.id}>
      <Item data={item} />
    </list-item>
  ))}
</list>
```

## Component Conversion Checklist

- [x] Button component
- [x] Input component
- [x] LoginScreen
- [x] RegisterScreen
- [ ] HomeScreen
- [ ] MapScreen
- [ ] ChatScreen
- [ ] VoiceCallScreen
- [ ] MembersScreen

## Services Compatibility

- ✅ API Service - Works with axios (browser compatible)
- ✅ WebSocket Service - Works with socket.io-client
- ⚠️ Location Service - May need LynxJS native modules
- ⚠️ WebRTC Service - May need LynxJS native modules
- ✅ State Management - Zustand works in any React environment

## Native Modules

For native functionality (location, camera, etc.), you may need to:

1. Check if LynxJS provides native modules
2. Create custom native modules if needed
3. Use web APIs where available

## CSS Styling Tips

- Use Flexbox for layouts (fully supported)
- Use CSS Grid where appropriate
- Use CSS variables for theming
- Use media queries for responsive design

## Performance Considerations

- LynxJS uses dual-thread architecture for better performance
- CSS rendering is optimized
- Bundle size may be smaller than React Native

## Troubleshooting

### Common Issues

1. **Components not rendering:**
   - Check if using lowercase tags (`<view>` not `<View>`)
   - Verify CSS classes are imported correctly

2. **Events not working:**
   - Use `bindtap` instead of `onPress`
   - Check event handler syntax

3. **Styling not applying:**
   - Ensure CSS files are imported
   - Check CSS class names match

## Resources

- [LynxJS Documentation](https://lynxjs.org)
- [ReactLynx Guide](https://lynxjs.org/react/introduction.html)
- [LynxJS GitHub](https://github.com/lynx-family)
