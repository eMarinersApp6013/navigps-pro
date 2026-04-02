# App Resources

Place your app icons and splash screens here before building:

## Required files:

### App Icon
- `icon.png` — 1024x1024px PNG (no transparency for iOS, transparency OK for Android)
- Used to auto-generate all required icon sizes for both platforms

### Splash Screen
- `splash.png` — 2732x2732px PNG (center your logo in the middle 1200x1200px area)
- Background color: #0a1628 (matches app theme)

## Generate all sizes:
```bash
# Install the resource generator
npm install -g @capacitor/assets

# Generate all icon and splash sizes from these source files
npx capacitor-assets generate --iconBackgroundColor '#0a1628' --splashBackgroundColor '#0a1628'
```

## Icon guidelines:
- Ship compass/navigation theme
- "SeaGPS Pro" or compass rose imagery
- Keep it simple — readable at 29x29px
- Use the app's green accent (#00e676) on dark background (#0a1628)
