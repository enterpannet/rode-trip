# Tailwind CSS Migration Guide

## ✅ Completed Setup

1. **Installed Packages:**
   - `tailwindcss` - Core Tailwind CSS
   - `@lynx-js/tailwind-preset` - LynxJS Tailwind preset
   - `autoprefixer` - Vendor prefixing
   - `postcss` - CSS processing
   - `postcss-loader`, `css-loader`, `style-loader` - Webpack loaders

2. **Configuration Files:**
   - `tailwind.config.js` - Tailwind config with LynxJS preset
   - `postcss.config.js` - PostCSS config
   - `lynx.config.js` - Updated webpack config with PostCSS loader
   - `app/index.css` - Main CSS with Tailwind directives

## 📝 Converted Components

- ✅ **Button.tsx** - Using Tailwind utility classes
- ✅ **Input.tsx** - Using Tailwind utility classes
- ✅ **LoginScreen.tsx** - Using Tailwind utility classes
- ✅ **RegisterScreen.tsx** - Using Tailwind utility classes
- ⚠️ **Other screens** - Need conversion

## 🎨 Tailwind Classes Used

### Common Patterns

```tsx
// Container
<view className="flex-1 bg-gray-100 w-full h-full">

// Flexbox
<view className="flex flex-col items-center justify-center">

// Spacing
<view className="p-4 m-2 gap-2">
<text className="mb-2 mt-4">

// Typography
<text className="text-2xl font-bold text-gray-800">

// Colors
<view className="bg-primary text-white">
<view className="bg-danger text-white">

// Borders & Radius
<view className="border rounded-lg border-gray-300">

// State
<view className="cursor-pointer active:opacity-70">
<view className="focus:border-primary focus:outline-none">
```

### Custom Colors

From `tailwind.config.js`:
- `bg-primary` - #007AFF
- `bg-secondary` - #6C757D
- `bg-danger` - #DC3545
- `bg-success` - #34C759
- `bg-warning` - #FF9500

## 🔄 Migration Steps

### Step 1: Remove CSS imports

**Before:**
```tsx
import './Button.css';
```

**After:**
```tsx
// No CSS import needed
```

### Step 2: Convert CSS classes to Tailwind

**Before (CSS):**
```css
.button {
  padding: 12px 24px;
  border-radius: 8px;
  background-color: #007AFF;
  color: #FFFFFF;
}
```

**After (Tailwind):**
```tsx
<view className="py-3 px-6 rounded-lg bg-primary text-white">
```

### Step 3: Update Component

**Before:**
```tsx
<view className="button button-primary">
  <text className="button-text">Click</text>
</view>
```

**After:**
```tsx
<view className="py-3 px-6 rounded-lg bg-primary text-white">
  <text className="text-base font-semibold">Click</text>
</view>
```

## 📚 Tailwind Utilities Reference

### Layout
- `flex`, `flex-col`, `flex-row`
- `items-center`, `items-start`, `items-end`
- `justify-center`, `justify-between`, `justify-around`
- `w-full`, `h-full`
- `min-h-[48px]`, `max-w-sm`

### Spacing
- `p-4`, `px-4`, `py-4` (padding)
- `m-4`, `mx-4`, `my-4` (margin)
- `gap-2`, `gap-4` (gap)

### Typography
- `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`
- `font-normal`, `font-semibold`, `font-bold`
- `text-center`, `text-left`, `text-right`

### Colors
- `bg-gray-100`, `bg-white`, `bg-primary`
- `text-gray-800`, `text-white`, `text-primary`
- `border-gray-300`, `border-primary`

### Borders
- `border`, `border-0`, `border-2`
- `rounded`, `rounded-lg`, `rounded-full`
- `border-primary`, `border-gray-300`

### States
- `cursor-pointer`, `cursor-not-allowed`
- `active:opacity-70`
- `focus:border-primary`, `focus:outline-none`
- `disabled:opacity-60`

## 🚀 Next Steps

1. Convert remaining screens:
   - HomeScreen
   - MapScreen
   - ChatScreen
   - VoiceCallScreen
   - MembersScreen

2. Remove old CSS files (optional):
   - `app/components/*.css`
   - `app/screens/*.css`

3. Customize Tailwind theme:
   - Add custom spacing
   - Add custom breakpoints
   - Add custom animations

## 💡 Tips

- Use Tailwind IntelliSense extension for autocomplete
- Group related utilities together
- Use custom colors from config
- Leverage responsive utilities if needed
- Use arbitrary values for specific needs: `min-h-[48px]`

## 📖 Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [LynxJS Tailwind Preset](https://www.npmjs.com/package/@lynx-js/tailwind-preset)
- [Tailwind IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
