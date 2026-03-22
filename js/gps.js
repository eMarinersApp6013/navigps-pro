/* ============================================================
   GEOLOCATION — with GPS Loss Freeze
   ============================================================ */
function startGeolocation() {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    const warn = document.getElementById('gpsWarning');
    warn.textContent = 'GPS REQUIRES HTTPS \u2014 Redirecting to secure connection...';
    warn.classList.add('show');
    setTimeout(function() { location.href = location.href.replace('http:', 'https:'); }, 1500);
    return;
  }
  if (!navigator.geolocation) {
    const warn = document.getElementById('gpsWarning');
    warn.textContent = 'GPS NOT SUPPORTED \u2014 Use a modern browser with location services';
    warn.classList.add('show');
    return;
  }
  STATE.watchId = navigator.geolocation.watchPosition(
    onPosition, onPositionError,
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

function onPosition(pos) {
  // Skip GPS updates if in manual mode
  if (STATE.manualMode) return;

  const c = pos.coords;
  STATE.lat = c.latitude;
  STATE.lon = c.longitude;
  STATE.alt = c.altitude;
  STATE.accuracy = c.accuracy;
  STATE.sogMS = c.speed;
  STATE.cogGPS = c.heading;

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
    document.getElementById('lastKnownLabel').style.display = 'none';
  }

  // Update GPS status
  document.getElementById('gpsStatusDot').className = 'status-dot active';

  // Warning check
  const threshold = parseInt(getSettings().accThreshold) || 50;
  const warn = document.getElementById('gpsWarning');
  warn.classList.toggle('show', STATE.accuracy > threshold);

  // Track trail
  if (getSettings().trackTrail && STATE.lat) {
    STATE.trackPoints.push([STATE.lat, STATE.lon]);
    if (STATE.trackPoints.length > 500) STATE.trackPoints.shift();
  }

  updateDisplay();
  updateMap();

  // Send to peer if sharing
  if (STATE.isSharing && STATE.conn && STATE.conn.open) {
    STATE.conn.send(JSON.stringify({
      type:'pos', lat:STATE.lat, lon:STATE.lon, acc:STATE.accuracy,
      spd:STATE.sogMS, cog:STATE.cogGPS, hdg:STATE.compassHeading,
      'var':STATE.magVar, alt:STATE.alt, ts:Date.now()
    }));
  }
}

function onPositionError(err) {
  document.getElementById('gpsStatusDot').className = 'status-dot inactive';

  // If we have last known data, FREEZE instead of clearing
  if (STATE.lastKnown && !STATE.manualMode) {
    STATE.gpsLost = true;

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

    // Show GPS LOST banner
    document.getElementById('gpsLostBanner').classList.add('show');

    // Show LAST KNOWN timestamp
    var lkLabel = document.getElementById('lastKnownLabel');
    var ts = STATE.lastKnown.timestamp;
    var timeStr = ts.getUTCHours().toString().padStart(2,'0') + ':' +
                  ts.getUTCMinutes().toString().padStart(2,'0') + ':' +
                  ts.getUTCSeconds().toString().padStart(2,'0') + ' UTC';
    lkLabel.textContent = 'LAST KNOWN \u2014 GPS lost at ' + timeStr;
    lkLabel.style.display = 'block';

    // Keep display updated with frozen values
    updateDisplay();
  }

  // Also show the warning banner with error details
  const warn = document.getElementById('gpsWarning');
  var msgs = {
    1: 'GPS DENIED \u2014 Allow location access in browser/phone settings',
    2: 'GPS UNAVAILABLE \u2014 Turn off airplane mode & enable Location Services',
    3: 'GPS TIMEOUT \u2014 Trying to acquire signal...'
  };
  warn.textContent = msgs[err.code] || 'GPS ERROR \u2014 ' + err.message;
  warn.classList.add('show');

  // For timeout, hide warning after 5s but keep frozen data
  if (err.code === 3) {
    setTimeout(function() { warn.classList.remove('show'); }, 5000);
  }
}
