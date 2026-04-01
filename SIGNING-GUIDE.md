# Code Signing Guide — NaviGPS Pro

## Why Signing Matters

Every Android APK must be signed with a cryptographic key before users can install it.
Every iOS app must be signed with an Apple provisioning profile.

**Debug builds** are auto-signed with a debug key (works for testing only).
**Release builds** need YOUR key — this proves the app came from you, not a hacker.

**CRITICAL:** If you lose your release keystore, you can NEVER update your app on Play Store.
You would have to publish a completely new app with a new package name.

---

## Android Signing

### Step 1: Generate Release Keystore (do this ONCE, keep forever)

Run this on your computer (not on a server):

```bash
keytool -genkeypair \
  -v \
  -keystore navigps-release.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias navigps \
  -dname "CN=eMarinersApp, OU=Navigation, O=eMarinersApp, L=Mumbai, ST=Maharashtra, C=IN"
```

You'll be prompted for two passwords:
1. **Keystore password** — protects the keystore file
2. **Key password** — protects the key inside (can be same as keystore password)

**Write these down and store securely. You'll need them forever.**

### Step 2: Back Up the Keystore

Make 3 copies and store in different places:
1. USB drive (keep in safe on ship)
2. Personal cloud storage (Google Drive, encrypted)
3. Email to yourself (as attachment)

### Step 3: Add to GitHub Secrets (for CI builds)

1. Base64 encode the keystore:
   ```bash
   base64 -w 0 navigps-release.jks > keystore-base64.txt
   ```

2. Go to GitHub repo > Settings > Secrets and variables > Actions

3. Add these secrets:
   | Secret Name | Value |
   |-------------|-------|
   | `RELEASE_KEYSTORE_BASE64` | Contents of keystore-base64.txt |
   | `KEYSTORE_PASSWORD` | Your keystore password |
   | `KEY_ALIAS` | `navigps` |
   | `KEY_PASSWORD` | Your key password |

4. Delete `keystore-base64.txt` after adding to GitHub.

### Step 4: Play App Signing (Recommended)

Google Play now offers **Play App Signing** — Google holds a copy of your key.
This means even if you lose your keystore, Google can help you recover.

1. Go to Play Console > Your App > Setup > App signing
2. Choose "Let Google manage my app signing key"
3. Upload your key or let Google generate one
4. You sign with an "upload key" (can be replaced if lost)
5. Google re-signs with the app signing key before distribution

**Strongly recommended for production apps.**

---

## iOS Signing

### Step 1: Apple Developer Account

1. Enroll at https://developer.apple.com/programs/ ($99/year)
2. Create an App ID: `com.emarinersapp.navigpspro`

### Step 2: Certificates

1. In Xcode: Preferences > Accounts > Add Apple ID
2. Xcode auto-manages signing certificates
3. Or manually create at https://developer.apple.com/account/resources/certificates

### Step 3: Provisioning Profiles

**Development profile:** For testing on your own devices
**Distribution profile:** For TestFlight and App Store

Xcode handles this automatically if you enable "Automatically manage signing."

### Step 4: TestFlight

1. Archive in Xcode: Product > Archive
2. Distribute App > App Store Connect
3. Go to https://appstoreconnect.apple.com
4. Your App > TestFlight tab
5. Add internal testers (up to 25, instant access)
6. Add external testers (up to 10,000, requires brief review)

---

## Security Rules

1. **NEVER commit keystore files to git**
   - Already in `.gitignore`: `*.keystore`, `*.jks`, `*.p12`

2. **NEVER put passwords in code or config files**
   - Use GitHub Secrets for CI
   - Use environment variables locally

3. **NEVER share your release keystore publicly**
   - Only store in GitHub Secrets (encrypted) and personal backups

4. **Rotate upload keys periodically**
   - If using Play App Signing, you can request a new upload key
   - This doesn't affect users — Play re-signs with the same app key

---

## Firebase Setup for App Distribution

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Create new project: "NaviGPS Pro"
3. Add Android app:
   - Package name: `com.emarinersapp.navigpspro`
   - App nickname: "NaviGPS Pro"
   - Skip SHA-1 for now

### Step 2: Enable App Distribution

1. In Firebase console: Release & Monitor > App Distribution
2. Click "Get started"
3. Create a tester group: "ship-testers"
4. Add your email address to the group

### Step 3: Get Firebase Token for CI

```bash
npm install -g firebase-tools
firebase login:ci
```

This outputs a token. Add it as GitHub Secret: `FIREBASE_TOKEN`
Also add `FIREBASE_APP_ID` from Firebase console > Project Settings > Your Apps.

### Step 4: How It Works

After setup, every push to `main`:
1. GitHub Actions builds the APK
2. Uploads to Firebase App Distribution
3. You get a notification on your phone
4. Tap to install the latest version
5. No Play Store needed for testing

---

## Google Play Console Setup

### Step 1: Create Developer Account

1. Go to https://play.google.com/console
2. Pay $25 one-time registration fee
3. Complete identity verification

### Step 2: Create App

1. Create app > Enter details:
   - App name: "NaviGPS Pro"
   - Default language: English
   - App type: App
   - Free or Paid: Free (or Paid if you want)
   - Category: Tools > Navigation

### Step 3: Internal Testing Track

1. Go to: Testing > Internal testing
2. Create new release
3. Upload your signed AAB file
4. Add testers (your email, crew emails)
5. Publish — available in minutes, no Google review

### Step 4: Closed Testing (Beta)

1. Go to: Testing > Closed testing
2. Create new track: "Maritime Beta"
3. Upload AAB
4. Add tester list or opt-in URL
5. Submit for review (usually 1-3 days)

### Step 5: Production

Only after thorough testing:
1. Go to: Production
2. Upload AAB
3. Complete store listing (screenshots, description, privacy policy)
4. Submit for review
