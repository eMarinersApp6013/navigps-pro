# SeaGPS Pro — Mobile App Build Guide

## Prerequisites

### For Android:
- Node.js 18+ and npm
- Android Studio (latest stable)
- Android SDK 34
- JDK 17

### For iOS:
- macOS with Xcode 15+
- CocoaPods (`sudo gem install cocoapods`)
- Apple Developer Account ($99/year)

## Step 1: Install Dependencies

```bash
cd navigps-pro
npm install
```

## Step 2: Initialize Capacitor Native Projects

```bash
# Generate the Android and iOS native projects
npx cap add android
npx cap add ios

# Copy web assets into native projects
npx cap sync
```

## Step 3: Register the GNSS Engine Plugin

### Android:
Copy the plugin files into the generated Android project:
```bash
# Copy plugin source files
cp -r android-plugin/src/main/java/com/emarinersapp/gnss/ \
  android/app/src/main/java/com/emarinersapp/gnss/

# Merge AndroidManifest permissions
# Add the permissions from android-plugin/src/main/AndroidManifest.xml
# into android/app/src/main/AndroidManifest.xml
```

Then register the plugin in `android/app/src/main/java/com/emarinersapp/navigpspro/MainActivity.java`:
```java
import com.emarinersapp.gnss.GnssEnginePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(GnssEnginePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
```

### iOS:
Copy the Swift plugin files:
```bash
cp ios-plugin/Sources/GnssEnginePlugin.swift ios/App/App/
cp ios-plugin/Sources/GnssEnginePlugin.m ios/App/App/
```

Add to `ios/App/App/Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>SeaGPS Pro needs your location for maritime navigation.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>SeaGPS Pro needs background location to track your vessel position during navigation watch.</string>
<key>UIBackgroundModes</key>
<array>
    <string>location</string>
</array>
```

## Step 4: Build

### Android APK/AAB:
```bash
# Open in Android Studio
npx cap open android

# Or build from command line
cd android
./gradlew assembleRelease    # APK
./gradlew bundleRelease      # AAB (for Play Store)
```

### iOS:
```bash
# Open in Xcode
npx cap open ios

# Build via Xcode: Product > Archive > Distribute
```

## Step 5: App Icons & Splash Screens

```bash
# Place source files:
# resources/icon.png (1024x1024)
# resources/splash.png (2732x2732)

npm install -g @capacitor/assets
npx capacitor-assets generate
```

## Step 6: Play Store / App Store Submission

### Google Play Store:
1. Create developer account ($25 one-time): https://play.google.com/console
2. Create new app > Upload AAB from `android/app/build/outputs/bundle/release/`
3. Fill in listing details, screenshots, privacy policy
4. Submit for review (usually 1-3 days)

### Apple App Store:
1. Apple Developer Program ($99/year): https://developer.apple.com
2. Archive in Xcode > Upload to App Store Connect
3. Fill in listing details, screenshots, privacy policy
4. Submit for review (usually 1-3 days)

## Privacy Policy Required

Both stores require a privacy policy. Your app collects:
- GPS/GNSS location data (for navigation)
- Device sensor data (compass, motion)
- No personal data is stored on servers
- Position sharing is opt-in and peer-to-peer

## Testing

### Android:
- Test on real device (emulator doesn't have real GNSS)
- Enable "Developer options" > "Mock location" for testing GPS spoofing
- Use "GPS Joystick" app to simulate different positions

### iOS:
- Test on real device (Simulator has limited GPS)
- Xcode > Debug > Simulate Location for testing

## Architecture

```
index.html + js/ + css/           ← Your web app (unchanged)
        │
   Capacitor Shell
        │
   ┌────┴────┐
Android      iOS
   │           │
GnssEngine   GnssEngine
(full GNSS)  (CLLocation)
   │           │
GnssPosition  Apple fused
Solver        position
(WLS from     (all sats
raw pseudo-   auto-combined)
ranges)
```
