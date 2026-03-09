# Logo Setup Guide for Locly Admin Panel

## Required Logo Files

Before deploying, you need to create and add the following logo files to the `/public` folder:

### 1. **favicon.ico** (Required)
- Size: 16x16, 32x32, 48x48 (multi-size .ico file)
- Location: `/public/favicon.ico`
- Used for: Browser tab icon

### 2. **icon.svg** (Optional but recommended)
- Size: Vector (scalable)
- Location: `/public/icon.svg`
- Used for: Modern browsers that support SVG favicons
- ✅ Already created as placeholder - replace with your actual logo

### 3. **icon-192.png** (Required for PWA)
- Size: 192x192 pixels
- Location: `/public/icon-192.png`
- Used for: Android home screen, PWA icon

### 4. **icon-512.png** (Required for PWA)
- Size: 512x512 pixels
- Location: `/public/icon-512.png`
- Used for: Android splash screen, PWA icon

### 5. **apple-icon.png** (Required for iOS)
- Size: 180x180 pixels
- Location: `/public/apple-icon.png`
- Used for: iOS home screen when app is saved

### 6. **og-image.png** (Required for social sharing)
- Size: 1200x630 pixels
- Location: `/public/og-image.png`
- Used for: Social media previews (Facebook, Twitter, LinkedIn)

## How to Create These Files

### Option 1: Using Online Tools
1. **Favicon Generator**: https://favicon.io/
   - Upload your logo
   - Download all sizes

2. **RealFaviconGenerator**: https://realfavicongenerator.net/
   - Upload your logo
   - Generates all required sizes

### Option 2: Using Design Tools
- **Figma/Adobe XD**: Design at highest resolution (512x512), then export at different sizes
- **Canva**: Use their favicon templates

### Option 3: Using Command Line (ImageMagick)
```bash
# Install ImageMagick
brew install imagemagick  # macOS

# Convert your logo to different sizes
convert logo.png -resize 192x192 icon-192.png
convert logo.png -resize 512x512 icon-512.png
convert logo.png -resize 180x180 apple-icon.png
convert logo.png -resize 1200x630 og-image.png
```

## Quick Setup Checklist

- [ ] Replace `/public/icon.svg` with your actual logo
- [ ] Add `/public/favicon.ico`
- [ ] Add `/public/icon-192.png`
- [ ] Add `/public/icon-512.png`
- [ ] Add `/public/apple-icon.png`
- [ ] Add `/public/og-image.png`
- [ ] Update domain in `/app/layout.tsx` (line 56) to your actual domain
- [ ] Update Twitter handle in `/app/layout.tsx` (line 73) if you have one
- [ ] Test on different devices and browsers

## Testing Your Setup

1. **Browser Tab**: Check if favicon appears
2. **Mobile (iOS)**: Save to home screen and check icon
3. **Mobile (Android)**: Install as PWA and check icon
4. **Social Media**: Share link and check preview image

## Brand Colors

Current theme color: `#F97316` (Orange)
Background color: `#ffffff` (White)

Update these in `/public/manifest.json` if needed.

## Notes

- The favicon.ico should include multiple sizes (16, 32, 48px) for better compatibility
- PNG files should have transparent backgrounds if your logo supports it
- OG image should have important content in the center (safe area)
- Test your logos on both light and dark backgrounds

