# NaviGPS Pro — Professional Development & Testing Setup

## Overview

This document covers the complete, proper development and testing pipeline
for NaviGPS Pro and all future eMarinersApp mobile apps. No shortcuts.

---

## 1. ONE-TIME SETUP (Do Once, Use Forever)

### 1.1 Android Studio — Required ($0, ~1.4GB download)
**Why:** Proper debugging, GPU profiling, logcat, layout inspector, emulator.
Even with CI building your APKs, you need Android Studio for:
- Debugging GNSS engine issues on real devices
- Profiling battery drain (critical for maritime apps)
- Layout inspector for different screen sizes
- Logcat for real-time crash diagnosis

**Install:**
1. Download from https://developer.android.com/studio (~1.2GB)
2. Install and let it download SDK components (~300MB more)
3. Total: ~1.5GB one-time download
4. After this, incremental updates are small (50-100MB)

**Data budget:** ~1.5GB one-time. On a 2GB satellite top-up, this is manageable.

### 1.2 Google Play Console — Required ($25 one-time)
**Why:** The ONLY way to distribute Android apps properly.
**URL:** https://play.google.com/console
**What you get:**
- Internal testing track (up to 100 testers, instant publish, no review)
- Closed testing track (invite-only, Google reviews in ~hours)
- Open testing track (public beta, Google reviews in ~hours)
- Production track (full Play Store listing)
- Pre-launch reports (automated testing on 15+ real devices)
- Android vitals (crash reports, ANR, battery, performance)
- Revenue/downloads analytics

### 1.3 Apple Developer Program — Required ($99/year)
**Why:** Required for TestFlight and App Store.
**URL:** https://developer.apple.com/programs/
**What you get:**
- TestFlight (up to 10,000 beta testers)
- App Store distribution
- Push notification certificates
- Required for any iOS distribution beyond your own device

### 1.4 Firebase Project — Free tier ($0)
**Why:** Crash reporting, analytics, A/B testing, App Distribution (OTA installs)
**URL:** https://console.firebase.google.com
**What you get (free tier):**
- Crashlytics (real-time crash reports)
- Analytics (user behavior, screen flows)
- App Distribution (send APKs directly to testers, no Play Store needed)
- Performance monitoring
- Up to 10GB storage, 1M analytics events/month

### 1.5 GitHub Account — Free ($0)
Already have this. Used for:
- Source code hosting
- GitHub Actions CI/CD (2,000 free minutes/month)
- Issue tracking
- Pull request reviews

---

## 2. COST SUMMARY

| Item | Cost | Frequency |
|------|------|-----------|
| Android Studio | $0 | Free forever |
| Google Play Console | $25 | One-time |
| Apple Developer Program | $99 | Annual |
| Firebase | $0 | Free tier sufficient |
| GitHub | $0 | Free tier sufficient |
| GitHub Actions | $0 | 2,000 min/month free |
| **TOTAL YEAR 1** | **$124** | |
| **TOTAL YEAR 2+** | **$99/year** | |

### Data Budget for Initial Setup:
| Download | Size |
|----------|------|
| Android Studio + SDK | ~1.5GB |
| Xcode (Mac only) | ~12GB |
| npm dependencies | ~200MB |
| Gradle dependencies (first build) | ~500MB |
| **Total (Android only)** | **~2.2GB** |
| **Total (Android + iOS)** | **~14GB** |

**Recommendation:** Get a 3-5GB data top-up for initial Android setup.
After that, daily development uses very little data (builds are local).

---

## 3. TESTING PIPELINE (Proper Professional Flow)

### 3.1 Testing Levels

```
Level 1: UNIT TESTS (automated, runs on every commit)
├── JavaScript module tests (STATE, GPS, celestial math, DR calculations)
├── Android GNSS solver tests (position computation, atmospheric corrections)
└── Runs in CI — no device needed

Level 2: INTEGRATION TESTS (automated, runs on every commit)
├── Native bridge ↔ STATE object communication
├── Capacitor plugin registration and method calls
└── Runs in CI — no device needed

Level 3: DEVICE TESTS (manual + automated, runs before release)
├── Real device GPS accuracy test
├── GNSS constellation switching test
├── Background GPS tracking test
├── Battery drain test (4-hour watch)
├── Offline mode test (airplane mode)
├── Screen rotation test
├── Different Android versions (API 24, 28, 31, 34)
└── Requires real device

Level 4: PRE-LAUNCH REPORT (automated by Google)
├── Google tests your APK on 15+ real devices
├── Screenshots, crash reports, performance metrics
├── Accessibility checks
└── Automatic when you upload to Play Store testing track

Level 5: BETA TESTING (real users)
├── Internal testing track: you + your team (instant, no review)
├── Closed testing: invited mariners only (review in hours)
├── Open testing: any mariner can join (review in hours)
└── Collect feedback before production launch
```

### 3.2 Testing Flow per Release

```
Code change
    │
    ▼
Git commit & push
    │
    ▼
GitHub Actions CI (automatic)
├── Run unit tests
├── Run integration tests
├── Build debug APK
├── Build release AAB (signed)
├── Run lint checks
└── Upload artifacts
    │
    ▼
Firebase App Distribution (automatic)
├── Sends APK to your test devices
├── You get a notification to install
└── No Play Store needed for quick testing
    │
    ▼
Manual device testing
├── Follow the testing checklist
├── Test on your actual phone on the ship
├── Log any issues as GitHub Issues
    │
    ▼
Play Store Internal Testing (when ready)
├── Upload AAB to internal track
├── Google runs pre-launch report
├── Install from Play Store on your devices
    │
    ▼
Play Store Closed Beta (optional)
├── Invite other mariners to test
├── Collect feedback and crash reports
    │
    ▼
Play Store Production
└── Full public release
```

---

## 4. DEVELOPMENT WORKFLOW

### Daily Development (on ship):
```bash
# 1. Make code changes
# 2. Test locally in browser first
# 3. Commit and push
git add -A
git commit -m "description of change"
git push

# 4. GitHub Actions automatically:
#    - Runs all tests
#    - Builds APK
#    - Uploads to Firebase App Distribution
#    - You get notification on phone to install new version

# 5. Test on your phone
# 6. If issues found, fix and repeat from step 1
```

### When You Need Android Studio (on shore):
- Deep debugging with breakpoints
- Profiling battery/memory/CPU
- Testing on Android emulator (different screen sizes)
- Updating Gradle/SDK versions
- Generating signed release builds locally

---

## 5. RELEASE CHECKLIST

Before every Play Store release:

- [ ] All unit tests passing (green CI)
- [ ] All integration tests passing
- [ ] Tested on real device with real GPS
- [ ] Tested constellation switching (Android)
- [ ] Tested offline mode (airplane mode)
- [ ] Tested background GPS tracking
- [ ] Battery drain acceptable (<5%/hour in background)
- [ ] No crashes in 1-hour continuous use
- [ ] Screen rotation works correctly
- [ ] All existing web modules working (charts, celestial, DR, weather)
- [ ] Version number bumped in package.json and capacitor.config.ts
- [ ] CHANGELOG.md updated
- [ ] APK size reasonable (<15MB)
- [ ] Google Pre-launch report clean (no crashes on test devices)

---

## 6. FILE STRUCTURE (Final)

```
navigps-pro/
├── .github/
│   └── workflows/
│       ├── build-apk.yml          ← CI: build + test + release
│       └── deploy-firebase.yml    ← CI: send to test devices
├── android-plugin/                ← GNSS Engine (Android native)
│   ├── src/main/java/com/emarinersapp/gnss/
│   │   ├── GnssEnginePlugin.java
│   │   └── GnssPositionSolver.java
│   ├── src/main/AndroidManifest.xml
│   └── build.gradle
├── ios-plugin/                    ← GPS plugin (iOS native)
│   └── Sources/
│       ├── GnssEnginePlugin.swift
│       └── GnssEnginePlugin.m
├── tests/                         ← Test suite
│   ├── unit/
│   │   ├── state.test.js
│   │   ├── gps.test.js
│   │   ├── celestial.test.js
│   │   ├── deadreckoning.test.js
│   │   └── native-bridge.test.js
│   ├── integration/
│   │   └── capacitor-bridge.test.js
│   └── device/
│       └── TESTING-CHECKLIST.md
├── css/
├── js/
├── resources/                     ← App icons, splash screens
├── index.html
├── package.json
├── capacitor.config.ts
├── DEVELOPMENT-SETUP.md           ← This file
├── BUILD.md
├── CHANGELOG.md
└── .gitignore
```
