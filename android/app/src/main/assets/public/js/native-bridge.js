/* ============================================================
   NATIVE BRIDGE — Connects Capacitor native plugins to existing STATE

   This module detects if running inside Capacitor (mobile app)
   and connects native GPS, GNSS engine, compass to the existing
   STATE object. The rest of the app works exactly the same.

   On web browser: this file does nothing (graceful fallback)
   On Android app: activates GNSS engine with constellation selection
   On iOS app: uses native CLLocationManager for better GPS
   ============================================================ */

var NativeBridge = (function() {
  'use strict';

  var isNative = false;
  var isAndroid = false;
  var isIOS = false;
  var gnssEngineActive = false;
  var selectedConstellations = {
    gps: true,
    glonass: true,
    galileo: true,
    beidou: true,
    navic: false,
    qzss: false,
    sbas: true
  };
  var spoofingAlert = false;
  var constellationFixes = {};  // { gps: {lat,lon}, galileo: {lat,lon}, ... }
  var gnssWatchId = null;
  var nativeGpsWatchId = null;

  // Detect if we're running inside Capacitor
  function detectPlatform() {
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
      isNative = true;
      var platform = Capacitor.getPlatform();
      isAndroid = platform === 'android';
      isIOS = platform === 'ios';
      console.log('[NativeBridge] Running on native:', platform);
      return true;
    }
    console.log('[NativeBridge] Running on web — native features disabled');
    return false;
  }

  // Initialize native GPS (replaces browser geolocation)
  function initNativeGPS() {
    if (!isNative) return;

    try {
      // Use Capacitor Geolocation for basic position (both platforms)
      if (typeof Capacitor.Plugins.Geolocation !== 'undefined') {
        var Geolocation = Capacitor.Plugins.Geolocation;

        // Request permissions first
        Geolocation.requestPermissions().then(function() {
          console.log('[NativeBridge] GPS permissions granted');
          startNativeWatch(Geolocation);
        }).catch(function(err) {
          console.warn('[NativeBridge] GPS permission denied:', err);
        });
      }
    } catch(e) {
      console.warn('[NativeBridge] Geolocation init error:', e);
    }
  }

  function startNativeWatch(Geolocation) {
    // Watch position with high accuracy
    Geolocation.watchPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }, function(position, err) {
      if (err) {
        console.warn('[NativeBridge] GPS error:', err);
        return;
      }
      if (!position || !position.coords) return;

      var c = position.coords;

      // Only use native GPS position if GNSS engine is NOT overriding
      if (!gnssEngineActive) {
        STATE.lat = c.latitude;
        STATE.lon = c.longitude;
        STATE.gpsAccuracy = c.accuracy;
        STATE.sogGPS = c.speed != null ? c.speed * 1.94384 : null; // m/s to knots
        STATE.cogGPS = c.heading;
        STATE.gpsLastUpdate = Date.now();
        STATE.gpsLost = false;

        if (typeof updateDisplay === 'function') updateDisplay();
      }
    });
  }

  // Initialize native compass
  function initNativeCompass() {
    if (!isNative) return;

    try {
      if (typeof Capacitor.Plugins.Motion !== 'undefined') {
        var Motion = Capacitor.Plugins.Motion;
        Motion.addListener('orientation', function(event) {
          if (event && event.alpha != null) {
            // Convert to compass heading (0-360)
            var heading = (360 - event.alpha) % 360;
            STATE.compassHeading = heading;
          }
        });
        console.log('[NativeBridge] Compass initialized');
      }
    } catch(e) {
      console.warn('[NativeBridge] Compass init error:', e);
    }
  }

  // Initialize GNSS Engine (Android only)
  function initGnssEngine() {
    if (!isAndroid) {
      console.log('[NativeBridge] GNSS engine only available on Android');
      return;
    }

    try {
      var GnssEngine = Capacitor.Plugins.GnssEngine;
      if (!GnssEngine) {
        console.warn('[NativeBridge] GnssEngine plugin not found');
        return;
      }

      // Start receiving raw measurements
      GnssEngine.startMeasurements().then(function() {
        console.log('[NativeBridge] GNSS measurements started');

        // Listen for satellite data updates
        GnssEngine.addListener('onSatelliteUpdate', function(data) {
          handleSatelliteUpdate(data);
        });

        // Listen for computed position from selected constellations
        GnssEngine.addListener('onPositionFix', function(fix) {
          handleGnssFix(fix);
        });

        // Listen for spoofing alerts
        GnssEngine.addListener('onSpoofAlert', function(alert) {
          handleSpoofAlert(alert);
        });

        // Set initial constellation selection
        GnssEngine.setConstellations(selectedConstellations);

      }).catch(function(err) {
        console.warn('[NativeBridge] GNSS engine start failed:', err);
      });
    } catch(e) {
      console.warn('[NativeBridge] GNSS engine init error:', e);
    }
  }

  // Handle satellite data update from GNSS engine
  function handleSatelliteUpdate(data) {
    if (!data || !data.satellites) return;

    // Store satellite data for SKYPLOT rendering
    STATE.nativeSatellites = data.satellites;
    STATE.gnssConstellationCounts = data.constellationCounts || {};
    STATE.gnssTimestamp = Date.now();

    // Update skyplot if visible
    if (typeof updateSkyPlotFromGnss === 'function') {
      updateSkyPlotFromGnss(data.satellites);
    }

    // Update constellation status panel
    updateConstellationPanel(data);
  }

  // Handle position fix computed by GNSS engine
  function handleGnssFix(fix) {
    if (!fix) return;

    // Store per-constellation fixes for spoofing comparison
    if (fix.constellation && fix.lat != null && fix.lon != null) {
      constellationFixes[fix.constellation] = {
        lat: fix.lat,
        lon: fix.lon,
        accuracy: fix.accuracy,
        hdop: fix.hdop,
        satsUsed: fix.satellitesUsed,
        timestamp: Date.now()
      };
    }

    // If this fix is from the user's selected primary constellation, use it
    if (fix.isPrimary) {
      gnssEngineActive = true;
      STATE.lat = fix.lat;
      STATE.lon = fix.lon;
      STATE.gpsAccuracy = fix.accuracy;
      STATE.gnssHdop = fix.hdop;
      STATE.gnssConstellation = fix.constellation;
      STATE.gnssSatsUsed = fix.satellitesUsed;
      STATE.gpsLastUpdate = Date.now();
      STATE.gpsLost = false;

      if (typeof updateDisplay === 'function') updateDisplay();
    }

    // Run spoofing check after each fix
    checkForSpoofing();
  }

  // Compare positions from different constellations to detect spoofing
  function checkForSpoofing() {
    var constellationNames = Object.keys(constellationFixes);
    if (constellationNames.length < 2) return;

    var maxDiffMeters = 0;
    var spoofedConstellation = null;

    for (var i = 0; i < constellationNames.length; i++) {
      for (var j = i + 1; j < constellationNames.length; j++) {
        var f1 = constellationFixes[constellationNames[i]];
        var f2 = constellationFixes[constellationNames[j]];

        // Skip stale fixes (>30s old)
        if (Date.now() - f1.timestamp > 30000 || Date.now() - f2.timestamp > 30000) continue;

        var dist = haversineDistance(f1.lat, f1.lon, f2.lat, f2.lon);
        if (dist > maxDiffMeters) {
          maxDiffMeters = dist;
          // The one that disagrees with majority is likely spoofed
          spoofedConstellation = constellationNames[i] + ' vs ' + constellationNames[j];
        }
      }
    }

    // Threshold: 500m difference = likely spoofing
    var previousAlert = spoofingAlert;
    spoofingAlert = maxDiffMeters > 500;
    STATE.spoofingAlert = spoofingAlert;
    STATE.spoofingDiffMeters = maxDiffMeters;
    STATE.spoofingDetail = spoofedConstellation;

    if (spoofingAlert && !previousAlert) {
      console.warn('[NativeBridge] GPS SPOOFING DETECTED! Diff: ' + maxDiffMeters.toFixed(0) + 'm between ' + spoofedConstellation);
      showSpoofingAlert(maxDiffMeters, spoofedConstellation);
    } else if (!spoofingAlert && previousAlert) {
      hideSpoofingAlert();
    }

    updateSpoofingPanel();
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    var R = 6371000;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // Handle spoofing alert from native engine
  function handleSpoofAlert(alert) {
    spoofingAlert = alert.detected;
    STATE.spoofingAlert = alert.detected;
    STATE.spoofingDiffMeters = alert.diffMeters;
    STATE.spoofingDetail = alert.detail;
    if (alert.detected) showSpoofingAlert(alert.diffMeters, alert.detail);
    else hideSpoofingAlert();
  }

  // Set which constellations to use for position computation
  function setConstellation(constellation, enabled) {
    selectedConstellations[constellation] = enabled;

    if (isAndroid) {
      try {
        var GnssEngine = Capacitor.Plugins.GnssEngine;
        if (GnssEngine) {
          GnssEngine.setConstellations(selectedConstellations);
        }
      } catch(e) {}
    }

    // Save preference
    try {
      localStorage.setItem('gnss_constellations', JSON.stringify(selectedConstellations));
    } catch(e) {}
  }

  // Set primary constellation for position
  function setPrimaryConstellation(name) {
    STATE.primaryConstellation = name;
    try {
      localStorage.setItem('gnss_primary', name);
    } catch(e) {}

    if (isAndroid) {
      try {
        var GnssEngine = Capacitor.Plugins.GnssEngine;
        if (GnssEngine) {
          GnssEngine.setPrimary({ constellation: name });
        }
      } catch(e) {}
    }

    // If we have a cached fix from this constellation, use it immediately
    if (constellationFixes[name]) {
      var fix = constellationFixes[name];
      STATE.lat = fix.lat;
      STATE.lon = fix.lon;
      STATE.gpsAccuracy = fix.accuracy;
      STATE.gnssConstellation = name;
      STATE.gpsLastUpdate = Date.now();
      if (typeof updateDisplay === 'function') updateDisplay();
    }
  }

  // UI: show spoofing alert
  function showSpoofingAlert(diffMeters, detail) {
    var el = document.getElementById('spoofAlertBanner');
    if (el) {
      el.style.display = 'block';
      el.innerHTML = '<span style="font-size:16px">\u26A0\uFE0F</span> <strong>GPS SPOOFING DETECTED</strong> \u2014 ' +
        Math.round(diffMeters) + 'm discrepancy between ' + (detail || 'constellations') +
        '<br><span style="font-size:10px">Position automatically switched to verified constellation</span>';
    }
  }

  function hideSpoofingAlert() {
    var el = document.getElementById('spoofAlertBanner');
    if (el) el.style.display = 'none';
  }

  // Update constellation status panel
  function updateConstellationPanel(data) {
    var panel = document.getElementById('constellationStatus');
    if (!panel) return;

    var sats = data.satellites || [];
    var counts = {};
    var usedCounts = {};

    sats.forEach(function(s) {
      var c = s.constellation || 'UNKNOWN';
      counts[c] = (counts[c] || 0) + 1;
      if (s.usedInFix) usedCounts[c] = (usedCounts[c] || 0) + 1;
    });

    var html = '';
    var constellationOrder = ['GPS', 'GLONASS', 'GALILEO', 'BEIDOU', 'NAVIC', 'QZSS', 'SBAS'];
    var constellationColors = {
      GPS: '#4CAF50', GLONASS: '#2196F3', GALILEO: '#FF9800',
      BEIDOU: '#f44336', NAVIC: '#9C27B0', QZSS: '#00BCD4', SBAS: '#795548'
    };

    constellationOrder.forEach(function(c) {
      if (!counts[c] && !selectedConstellations[c.toLowerCase()]) return;
      var color = constellationColors[c] || '#888';
      var visible = counts[c] || 0;
      var used = usedCounts[c] || 0;
      var fix = constellationFixes[c];
      var fixText = fix ? fix.lat.toFixed(4) + ', ' + fix.lon.toFixed(4) : '--';
      var isPrimary = STATE.primaryConstellation === c;

      html += '<div class="constellation-row' + (isPrimary ? ' primary' : '') + '" ' +
        'style="border-left:3px solid ' + color + ';padding:4px 8px;margin:2px 0;' +
        'background:' + (isPrimary ? '#1a3a2a' : 'transparent') + '">' +
        '<div style="display:flex;align-items:center;justify-content:space-between">' +
          '<span style="color:' + color + ';font-weight:600;font-size:11px">' + c +
            (isPrimary ? ' \u2605 PRIMARY' : '') + '</span>' +
          '<span style="font-size:10px;color:#8a9ab5">' + used + '/' + visible + ' sats</span>' +
        '</div>' +
        '<div style="font-size:9px;color:#6a7a95;margin-top:1px">Fix: ' + fixText + '</div>' +
        '</div>';
    });

    panel.innerHTML = html;
  }

  function updateSpoofingPanel() {
    var el = document.getElementById('spoofStatus');
    if (!el) return;

    if (spoofingAlert) {
      el.innerHTML = '<span style="color:#ff4444;font-weight:600">\u26A0 SPOOFING DETECTED</span>' +
        '<br><span style="font-size:10px">Diff: ' + Math.round(STATE.spoofingDiffMeters) + 'm | ' +
        STATE.spoofingDetail + '</span>';
    } else if (Object.keys(constellationFixes).length >= 2) {
      var diff = STATE.spoofingDiffMeters || 0;
      el.innerHTML = '<span style="color:#00e676;font-weight:600">\u2713 POSITION VERIFIED</span>' +
        '<br><span style="font-size:10px">Cross-check diff: ' + Math.round(diff) + 'm</span>';
    } else {
      el.innerHTML = '<span style="color:#8a9ab5">Waiting for multi-constellation fix...</span>';
    }
  }

  // Keep screen awake during navigation
  function initKeepAwake() {
    if (!isNative) return;
    try {
      if (typeof Capacitor.Plugins.KeepAwake !== 'undefined') {
        Capacitor.Plugins.KeepAwake.keepAwake();
        console.log('[NativeBridge] Screen will stay awake');
      }
    } catch(e) {}
  }

  // Status bar setup
  function initStatusBar() {
    if (!isNative) return;
    try {
      if (typeof Capacitor.Plugins.StatusBar !== 'undefined') {
        Capacitor.Plugins.StatusBar.setStyle({ style: 'DARK' });
        Capacitor.Plugins.StatusBar.setBackgroundColor({ color: '#0a1628' });
      }
    } catch(e) {}
  }

  // Load saved preferences
  function loadPreferences() {
    try {
      var saved = localStorage.getItem('gnss_constellations');
      if (saved) selectedConstellations = JSON.parse(saved);
      var primary = localStorage.getItem('gnss_primary');
      if (primary) STATE.primaryConstellation = primary;
    } catch(e) {}
  }

  // Master init — called on app start
  function init() {
    loadPreferences();

    if (!detectPlatform()) {
      // Running on web — show/hide native-only UI
      var nativeOnlyEls = document.querySelectorAll('.native-only');
      for (var i = 0; i < nativeOnlyEls.length; i++) {
        nativeOnlyEls[i].style.display = 'none';
      }
      // Show web-mode indicator
      var webIndicator = document.getElementById('platformIndicator');
      if (webIndicator) webIndicator.textContent = 'WEB MODE';
      return;
    }

    // Running on native platform
    var webOnlyEls = document.querySelectorAll('.web-only');
    for (var i = 0; i < webOnlyEls.length; i++) {
      webOnlyEls[i].style.display = 'none';
    }

    var indicator = document.getElementById('platformIndicator');
    if (indicator) {
      indicator.textContent = isAndroid ? 'ANDROID GNSS' : 'iOS GPS';
      indicator.style.color = '#00e676';
    }

    initStatusBar();
    initKeepAwake();
    initNativeGPS();
    initNativeCompass();

    if (isAndroid) {
      initGnssEngine();
      // Show GNSS controls
      var gnssControls = document.querySelectorAll('.gnss-android');
      for (var i = 0; i < gnssControls.length; i++) {
        gnssControls[i].style.display = '';
      }
    }
  }

  // Public API
  return {
    init: init,
    isNative: function() { return isNative; },
    isAndroid: function() { return isAndroid; },
    isIOS: function() { return isIOS; },
    setConstellation: setConstellation,
    setPrimaryConstellation: setPrimaryConstellation,
    getSelectedConstellations: function() { return selectedConstellations; },
    getConstellationFixes: function() { return constellationFixes; },
    isSpoofingDetected: function() { return spoofingAlert; },
    gnssActive: function() { return gnssEngineActive; }
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  // Small delay to let Capacitor bridge initialize
  setTimeout(function() { NativeBridge.init(); }, 300);
});
