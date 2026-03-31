# NaviGPS Pro — Device Testing Checklist

Use this checklist before every release. Test on a real Android device with GPS.

---

## Test Environment

- **Device:** ________________________ (e.g., Samsung Galaxy A54)
- **Android Version:** ________________ (e.g., Android 14, API 34)
- **App Version:** ____________________ (e.g., 1.0.0-debug)
- **Build:** __________________________ (e.g., GitHub Actions #45)
- **Location:** _______________________ (e.g., Arabian Sea, 22°N 068°E)
- **Date:** ___________________________
- **Tester:** _________________________

---

## 1. INSTALLATION & LAUNCH

- [ ] APK installs without errors
- [ ] App opens without crash
- [ ] Splash screen appears with correct branding
- [ ] Status bar color matches app theme (#0a1628)
- [ ] App requests location permission on first launch
- [ ] Permission grant succeeds, GPS starts acquiring

## 2. GPS & POSITION

- [ ] Position appears within 30 seconds of granting permission
- [ ] Latitude/Longitude displayed correctly in status bar
- [ ] Position format matches setting (DM/DMS/DD)
- [ ] GPS accuracy displayed and reasonable (<50m outdoor)
- [ ] SOG (Speed Over Ground) updates when moving
- [ ] COG (Course Over Ground) updates when moving
- [ ] GPS age counter ticks correctly ("2s ago", "5s ago")
- [ ] GPS LOST warning appears if GPS blocked for >60s
- [ ] GPS recovers after being blocked and unblocked

## 3. GNSS CONSTELLATION PANEL (Android only)

- [ ] GNSS Control Panel visible at top of NAV tab
- [ ] Constellation toggles work (GPS, GLONASS, Galileo, BeiDou, SBAS)
- [ ] Satellite counts update in real-time
- [ ] Primary constellation selector works
- [ ] Switching primary constellation changes position source
- [ ] Per-constellation position fixes displayed
- [ ] Spoofing status shows "Waiting..." then "POSITION VERIFIED"

## 4. ALL EXISTING MODULES (must work same as website)

### NAV Display
- [ ] Position card shows lat/lon correctly
- [ ] Speed card shows SOG/COG
- [ ] Compass rose rotates with heading
- [ ] Compass heading matches phone orientation

### Chart/Map
- [ ] Map loads and shows current position
- [ ] Map pans and zooms smoothly
- [ ] Track trail draws behind vessel
- [ ] Seamarks layer loads (if setting enabled)
- [ ] Depth layer loads (if setting enabled)

### Bearing & Distance Calculator
- [ ] "Use Current Position" fills Point A
- [ ] Calculating bearing between two points works
- [ ] Great circle and rhumb line results shown

### Weather
- [ ] Weather data loads for current position
- [ ] Wind, waves, temperature displayed
- [ ] No API errors in console

### Dead Reckoning
- [ ] Can set course, speed, duration
- [ ] DR position calculated and shown on map
- [ ] DR circle shows estimated position area

### Celestial Navigation
- [ ] Sun/Moon/Star positions calculate correctly
- [ ] Almanac data matches expectations
- [ ] Celestial fix computation works

### Anchor Watch
- [ ] Can set anchor position
- [ ] Anchor circle appears on map
- [ ] Alarm triggers when dragging outside radius
- [ ] Alarm sound plays

### MOB (Man Overboard)
- [ ] MOB button records current position
- [ ] MOB marker appears on map
- [ ] Range and bearing to MOB position shown

### Share Position
- [ ] Can start sending position
- [ ] Code generated for receiver
- [ ] Position streams to connected receiver

### Settings
- [ ] Night mode toggle works
- [ ] Wake lock toggle works
- [ ] Position format switching works
- [ ] All toggles persist after app restart

## 5. BACKGROUND & LIFECYCLE

- [ ] GPS continues tracking when screen is off
- [ ] GPS continues when switching to another app
- [ ] App resumes correctly after being in background
- [ ] App resumes correctly after screen on/off
- [ ] No crash after 1 hour of continuous tracking
- [ ] Wake lock keeps screen on when enabled

## 6. BATTERY & PERFORMANCE

- [ ] Battery usage after 1 hour: _____%
- [ ] Battery usage after 4 hours: _____%
- [ ] App does not get hot (excessive CPU)
- [ ] App does not consume excessive memory
- [ ] Smooth scrolling, no UI jank
- [ ] Map does not lag during vessel movement

## 7. SCREEN & ORIENTATION

- [ ] Portrait mode displays correctly
- [ ] Landscape mode displays correctly
- [ ] Rotating phone does not lose state
- [ ] All text readable on small screens (5" phone)
- [ ] All text readable on large screens (10" tablet)

## 8. OFFLINE / NETWORK

- [ ] App works in airplane mode (GPS only, no weather/charts)
- [ ] App recovers gracefully when network returns
- [ ] No crash when network unavailable
- [ ] Chart tiles cached from previous sessions display

## 9. EDGE CASES

- [ ] App works at high latitude (>70°N)
- [ ] App works at equator (0°N)
- [ ] App works crossing date line (180°E/W)
- [ ] App works with very low GPS accuracy (>100m)
- [ ] App handles GPS giving 0,0 coordinates (null island check)

## 10. GPS SPOOFING TEST (Android only)

- [ ] Install "GPS Joystick" app or enable mock locations
- [ ] Enable mock location in Developer Options
- [ ] Set a fake position far from real position
- [ ] App shows spoofing alert (red banner)
- [ ] App auto-switches to verified constellation
- [ ] Disable mock location, app recovers to real position

---

## Test Result

- [ ] **PASS** — All critical items checked, ready for release
- [ ] **FAIL** — Issues found (list below)

### Issues Found:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Notes:
_______________________________________________
_______________________________________________
