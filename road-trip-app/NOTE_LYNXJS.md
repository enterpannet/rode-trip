# Note: LynxJS Migration

## Current Status

The project has been converted back to **React Native + Expo** with **StyleSheet** instead of Tailwind CSS, as requested.

## Why Not LynxJS?

During the migration attempt, we discovered that:
- `@lynx-js/react` package is **not available** in npm registry
- `@lynx-js/tailwind-preset` package is **not available** in npm registry
- LynxJS official packages may not be publicly released yet

## Current Setup

### Framework
- **React Native** 0.76.0
- **Expo SDK** 54
- **React** 18.3.1

### Styling
- **React Native StyleSheet** (no Tailwind CSS)
- All components and screens use `StyleSheet.create()`
- No CSS files - everything in component files

### Navigation
- **React Navigation** Stack Navigator
- State-based navigation ready for future migration

## Components

All components use React Native primitives:
- `View` instead of `<view>`
- `Text` instead of `<text>`
- `TouchableOpacity` instead of `<view bindtap>`
- `StyleSheet.create()` instead of CSS classes

## Ready for LynxJS Migration

If LynxJS packages become available in the future, the codebase is structured to easily migrate:

1. Replace `View` → `<view>`
2. Replace `Text` → `<text>`
3. Replace `TouchableOpacity` → `<view bindtap>`
4. Replace `StyleSheet` → CSS files
5. Replace `onPress` → `bindtap`
6. Update navigation system

## To Use LynxJS in Future

1. Check if `@lynx-js/react` is now available:
   ```bash
   npm search @lynx-js/react
   ```

2. If available, install:
   ```bash
   npm install @lynx-js/react
   ```

3. Update package.json scripts for LynxJS
4. Convert components to LynxJS syntax
5. Update configuration files

## Resources

- [LynxJS Documentation](https://lynxjs.org)
- [React Native Documentation](https://reactnative.dev)
- [Expo Documentation](https://docs.expo.dev)
