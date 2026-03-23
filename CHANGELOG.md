# Changelog — NaviGPS Pro

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-03-23

### Added — Mobile App Foundation
- **Capacitor 6.x** mobile app shell wrapping existing web app
- **Android GNSS Engine Plugin** — raw satellite measurements from all constellations
  - GPS, GLONASS, Galileo, BeiDou, NavIC, QZSS, SBAS support
  - Per-constellation independent position computation
  - Weighted Least Squares solver with atmospheric corrections
  - Klobuchar ionospheric + Saastamoinen tropospheric models
- **GPS Spoofing Detection** — cross-checks fixes from different constellations
  - Auto-switches to verified constellation when spoofing detected
  - Red alert banner with spoofing details
- **iOS Plugin** — CLLocationManager with background tracking
- **GNSS Constellation Control Panel** — toggle constellations, select primary
- **Native Bridge** — connects native GNSS to existing STATE object seamlessly
- **CI/CD Pipeline** — GitHub Actions builds debug/release APK/AAB automatically
- **Firebase App Distribution** — OTA APK delivery to test devices
- **Unit Test Suite** — 52 tests covering STATE, display, variation, native bridge
- **Device Testing Checklist** — comprehensive QA procedure for maritime testing

### Unchanged
- All existing web modules (charts, celestial, DR, weather, compass, share, etc.)
- Website continues to work identically in any browser
- No breaking changes to any existing functionality
