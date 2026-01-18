# Fix Windows Expo Start Error

## Problem

When running `expo start` on Windows, you might encounter:
```
Error: ENOENT: no such file or directory, mkdir 'C:\APP\MAP\road-trip-app\.expo\metro\externals\node:sea'
```

This is caused by Expo SDK 50 trying to create a directory with `:` in the name, which is not allowed on Windows.

## Solution 1: Use --clear flag (Quick Fix)

Always use the `--clear` flag when starting Expo:

```powershell
npm start -- --clear
```

Or modify `package.json`:
```json
"start": "expo start --clear"
```

## Solution 2: Clear Expo Cache

1. Delete `.expo` folder:
```powershell
Remove-Item -Path .expo -Recurse -Force
```

2. Delete node_modules cache:
```powershell
Remove-Item -Path node_modules\.cache -Recurse -Force -ErrorAction SilentlyContinue
```

3. Clear npm cache:
```powershell
npm cache clean --force
```

4. Reinstall dependencies:
```powershell
Remove-Item -Path node_modules -Recurse -Force
npm install
```

5. Start with clear:
```powershell
npm start -- --clear
```

## Solution 3: Update Expo SDK

Update to Expo SDK 51+ (if available):

```powershell
npm install expo@latest
```

Then update React Native to compatible version:
```powershell
npx expo install react-native@latest
```

## Solution 4: Use Metro Config Fix

The `metro.config.js` file has been configured to work around this issue on Windows.

## Temporary Workaround

If the error persists, you can manually create the directory structure:

```powershell
# Create parent directories
New-Item -ItemType Directory -Path .expo\metro\externals -Force

# The node:sea directory will be skipped, but this prevents the error
```

## Verify Fix

After applying fixes, try:
```powershell
npm start
```

The app should start without the `node:sea` error.
