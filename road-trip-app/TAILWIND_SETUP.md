# Tailwind CSS Setup for LynxJS

## ✅ Installed Packages

- `tailwindcss` - Tailwind CSS framework
- `autoprefixer` - CSS vendor prefixing
- `postcss` - CSS processing
- `postcss-loader` - Webpack loader for PostCSS
- `css-loader` - Webpack loader for CSS
- `style-loader` - Webpack loader for injecting CSS

## 📁 Configuration Files

1. **tailwind.config.js** - Tailwind configuration
   - Content paths: `./app/**/*.{js,jsx,ts,tsx}`
   - Custom colors: primary, secondary, danger, success, warning

2. **postcss.config.js** - PostCSS configuration
   - Plugins: tailwindcss, autoprefixer

3. **app/index.css** - Main CSS file with Tailwind directives
   - `@tailwind base;`
   - `@tailwind components;`
   - `@tailwind utilities;`

4. **lynx.config.js** - Updated webpack config
   - Added PostCSS loader for processing CSS with Tailwind

## 🎨 Usage

### Component Example

```tsx
// Before (CSS files)
<view className="container">
  <text className="title">Hello</text>
</view>

// After (Tailwind)
<view className="flex-1 bg-gray-100 p-4">
  <text className="text-2xl font-bold text-gray-800">Hello</text>
</view>
```

### Custom Colors

```tsx
// Using custom colors from tailwind.config.js
<view className="bg-primary">Primary</view>
<view className="bg-secondary">Secondary</view>
<view className="bg-danger">Danger</view>
<view className="bg-success">Success</view>
```

## 📝 Converted Components

- ✅ Button.tsx - Using Tailwind classes
- ✅ Input.tsx - Using Tailwind classes
- ✅ LoginScreen.tsx - Using Tailwind classes
- ✅ RegisterScreen.tsx - Using Tailwind classes
- ⚠️ Other screens - Need conversion

## 🚀 Next Steps

1. Convert remaining screens to use Tailwind classes
2. Remove old CSS files (optional)
3. Customize Tailwind theme as needed
4. Add Tailwind plugins if needed

## 💡 Benefits

- ✅ Utility-first CSS - Faster development
- ✅ Smaller bundle size with purging
- ✅ Consistent design system
- ✅ Responsive design utilities
- ✅ Dark mode support (can be added)

## 📚 Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [LynxJS Styling](https://lynxjs.org/react/introduction.html)
