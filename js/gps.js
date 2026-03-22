/* ============================================================
   GEOLOCATION — Live updates with watchdog + age counter
   ============================================================ */
var GPS_WATCHDOG_TIMEOUT = 30000; // 30s no update → force getCurrentPosition
var GPS_LOST_TIMEOUT = 60000;     // 60s no update → GPS LOST state

function startGeolocation() {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    var warn = document.getElementById('gpsWarning');
    warn.textContent = 'GPS REQUIRES HTTPS \u2014 Redirecting to secure connection...';
    warn.classList.add('show');
    setTimeout(function() { location.href = location.href.replace('http:', 'https:'); }, 1500);
    return;
  }
  if (!navigator.geolocation) {
    var warn = document.getElementById('gpsWarning');
    warn.textContent = 'GPS NOT SUPPORTED \u2014 Use a modern browser with location services';
    warn.classList.add('show');
    return;
  }
  STATE.watchId = navigator.geolocation.watchPosition(
    onPosition, onPositionError,
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );

  // Start GPS age counter (ticks every second)
  STATE.gpsAgeTimer = setInterval(updateGpsAge, 1000);

  // Start watchdog
  resetGpsWatchdog();
}

function resetGpsWatchdog() {
  if (STATE.gpsWatchdogTimer) clearTimeout(STATE.gpsWatchdogTimer);
  STATE.gpsWatchdogTimer = setTimeout(gpsWatchdogFire, GPS_WATCHDOG_TIMEOUT);
}

function gpsWatchdogFire() {
  // No GPS update for 30s — force a one-shot getCurrentPosition
  if (!STATE.manualMode && !STATE.remoteMode) {
    navigator.geolocation.getCurrentPosition(onPosition, function() {}, {
      enableHighAccuracy: true, timeout: 10000, maximumAge: 0
    });
  }
  // Set another watchdog for 30s later (GPS LOST triggers at 60s via age counter)
  STATE.gpsWatchdogTimer = setTimeout(gpsWatchdogFire, GPS_WATCHDOG_TIMEOUT);
}

function updateGpsAge() {
  if (STATE.manualMode || STATE.remoteMode) return;
  var ageEl = document.getElementById('gpsAge');
  if (!STATE.lastGpsTimestamp) {
    if (ageEl) ageEl.textContent = 'No fix yet';
    return;
  }
  var ageSec = Math.round((Date.now() - STATE.lastGpsTimestamp) / 1000);
  if (ageEl) {
    ageEl.textContent = ageSec + 's ago';
    ageEl.style.color = ageSec < 10 ? 'var(--accent)' : ageSec < 30 ? 'var(--warning)' : 'var(--danger)';
  }

  // Trigger GPS LOST after 60s
  if (ageSec >= 60 && !STATE.gpsLost && STATE.lastKnown) {
    triggerGpsLost();
  }
}

function onPosition(pos) {
  // Skip GPS updates if in manual or remote mode
  if (STATE.manualMode || STATE.remoteMode) return;

  var c = pos.coords;
  STATE.lat = c.latitude;
  STATE.lon = c.longitude;
  STATE.alt = c.altitude;
  STATE.accuracy = c.accuracy;
  STATE.sogMS = c.speed;
  STATE.cogGPS = c.heading;
  STATE.lastGpsTimestamp = Date.now();

  // Magnetic variation
  STATE.magVar = calcMagVar(STATE.lat, STATE.lon, getDecimalYear());

  // Save as last known good position
  STATE.lastKnown = {
    lat: STATE.lat, lon: STATE.lon, alt: STATE.alt,
    accuracy: STATE.accuracy, sogMS: STATE.sogMS,
    cogGPS: STATE.cogGPS, compassHeading: STATE.compassHeading,
    magVar: STATE.magVar,
    timestamp: new Date()
  };

  // GPS is back — clear frozen state
  if (STATE.gpsLost) {
    STATE.gpsLost = false;
    document.getElementById('tab-nav').classList.remove('gps-frozen');
    document.getElementById('gpsLostBanner').classList.remove('show');
    var lk = document.getElementById('lastKnownLabel');
    if (lk) lk.style.display = 'none';
  }

  // Update GPS status
  document.getElementById('gpsStatusDot').className = 'status-dot active';

  // Warning check
  var threshold = parseInt(getSettings().accThreshold) || 50;
  var warn = document.getElementById('gpsWarning');
  warn.classList.toggle('show', STATE.accuracy > threshold);

  // Track trail
  if (getSettings().trackTrail && STATE.lat) {
    STATE.trackPoints.push([STATE.lat, STATE.lon]);
    if (STATE.trackPoints.length > 500) STATE.trackPoints.shift();
  }

  // Reset watchdog
  resetGpsWatchdog();

  // Event-driven: refresh ALL displays immediately
  refreshAllDisplays();

  // Send to peer if sharing (also sent on 2s interval from share.js)
  sendPositionData();

  // Check anchor alarm
  if (STATE.anchorWatchActive) checkAnchorAlarm();
}

function triggerGpsLost() {
  if (!STATE.lastKnown || STATE.manualMode || STATE.remoteMode) return;
  STATE.gpsLost = true;
  document.getElementById('gpsStatusDot').className = 'status-dot inactive';

  // Restore frozen values
  STATE.lat = STATE.lastKnown.lat;
  STATE.lon = STATE.lastKnown.lon;
  STATE.alt = STATE.lastKnown.alt;
  STATE.accuracy = STATE.lastKnown.accuracy;
  STATE.sogMS = STATE.lastKnown.sogMS;
  STATE.cogGPS = STATE.lastKnown.cogGPS;
  STATE.magVar = STATE.lastKnown.magVar;

  // Show frozen UI
  document.getElementById('tab-nav').classList.add('gps-frozen');
  document.getElementById('gpsLostBanner').classList.add('show');

  var lkLabel = document.getElementById('lastKnownLabel');
  var ts = STATE.lastKnown.timestamp;
  var timeStr = ts.getUTCHours().toString().padStart(2,'0') + ':' +
                ts.getUTCMinutes().toString().padStart(2,'0') + ':' +
                ts.getUTCSeconds().toString().padStart(2,'0') + ' UTC';
  lkLabel.textContent = 'LAST KNOWN \u2014 GPS lost at ' + timeStr;
  lkLabel.style.display = 'block';

  updateDisplay();
}

function onPositionError(err) {
  document.getElementById('gpsStatusDot').className = 'status-dot inactive';

  // Warning banner with error details
  var warn = document.getElementById('gpsWarning');
  var msgs = {
    1: 'GPS DENIED \u2014 Allow location access in browser/phone settings',
    2: 'GPS UNAVAILABLE \u2014 Turn off airplane mode & enable Location Services',
    3: 'GPS TIMEOUT \u2014 Trying to acquire signal...'
  };
  warn.textContent = msgs[err.code] || 'GPS ERROR \u2014 ' + err.message;
  warn.classList.add('show');

  if (err.code === 3) {
    setTimeout(function() { warn.classList.remove('show'); }, 5000);
  }

  // GPS LOST will be triggered by the age counter (60s threshold)
}

/* Refresh ALL displays (event-driven, called on every position update) */
function refreshAllDisplays() {
  // NAV tab — always update
  updateDisplay();

  // CHART tab — update map marker even if not visible (so it's correct when switched)
  updateMap();

  // SKYPLOT — update if visible
  if (document.getElementById('tab-skyplot').classList.contains('active')) {
    drawSkyPlot();
  }
  // CELESTIAL — update if visible
  if (document.getElementById('tab-celestial').classList.contains('active')) {
    renderCelestial();
  }
  // MOB distance if active
  if (STATE.mobPosition) updateMOBDistance();
  // Anchor watch distance
  if (STATE.anchorWatchActive) updateAnchorDisplay();

  // If in remote mode, ensure GPS status shows remote-driven
  if (STATE.remoteMode) {
    document.getElementById('gpsStatusDot').className = 'status-dot active';
    var ageEl = document.getElementById('gpsAge');
    if (ageEl) {
      ageEl.textContent = 'REMOTE';
      ageEl.style.color = 'var(--info, #2a7fff)';
    }
  }
}
