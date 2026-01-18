# Fix Windows Expo Start Error (node:sea)

## Problem
```
Error: ENOENT: no such file or directory, mkdir 'C:\APP\MAP\road-trip-app\.expo\metro\externals\node:sea'
```

## Quick Fix

### Option 1: Use --clear flag (Recommended)

```powershell
cd road-trip-app
npm start -- --clear
```

Or always use clear cache:
```powershell
npx expo start --clear
```

### Option 2: Manual Fix Steps

1. **Delete .expo folder:**
```powershell
cd road-trip-app
Remove-Item -Path .expo -Recurse -Force -ErrorAction SilentlyContinue
```

2. **Clear npm cache:**
```powershell
npm cache clean --force
```

3. **Reinstall dependencies:**
```powershell
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue
npm install
```

4. **Start with clear cache:**
```powershell
npm start -- --clear
```

### Option 3: Update package.json scripts

Edit `package.json` and change:
```json
"scripts": {
  "start": "expo start --clear",
  "android": "expo start --android --clear",
  "ios": "expo start --ios --clear"
}
```

Then run:
```powershell
npm start
```

## Why This Happens

Expo SDK 50 tries to create a directory named `node:sea` for Node.js Single Executable Application externals, but Windows doesn't allow `:` in directory names.

Using `--clear` flag forces Expo to rebuild the cache and skip problematic externals setup.

## Verify Fix

After applying fix, try:
```powershell
cd road-trip-app
npm start
```

The app should start without errors.
