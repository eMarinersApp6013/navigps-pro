/* ============================================================
   DEAD RECKONING MODE — GPS-Independent Position
   Auto-activates when spoofing detected.
   Uses compass heading + speed to calculate DR position from
   last known good fix. Shows growing uncertainty circle.
   ============================================================ */

var DR = {
  active: false,
  lastGoodPosition: null,  // { lat, lon, timestamp, accuracy }
  drLat: null,
  drLon: null,
  drStartTime: null,
  spoofingDetected: false,
  positionHistory: [],     // last 10 GPS positions for jump detection
  drTimer: null,
  drUncertaintyNm: 0,     // grows over time
  alerts: [],
  manualDR: false          // user manually activated DR
};

/* Spoofing detection thresholds */
var SPOOF_JUMP_THRESHOLD_M = 926;      // 0.5 nm = ~926m jump in one fix
var SPOOF_SPEED_THRESHOLD_KN = 40;     // max realistic ship speed
var SPOOF_ALT_THRESHOLD_M = 50;        // at sea, altitude should be near 0
var SPOOF_HEADING_MISMATCH_DEG = 45;   // GPS COG vs compass heading

/* Store position history for jump detection */
function recordPositionForSpoofCheck(lat, lon, spdMS, cog, alt, compassHdg) {
  var now = Date.now();
  DR.positionHistory.push({ lat: lat, lon: lon, spdMS: spdMS, cog: cog, alt: alt, compassHdg: compassHdg, ts: now });
  if (DR.positionHistory.length > 10) DR.positionHistory.shift();

  // Need at least 2 positions to check
  if (DR.positionHistory.length < 2) return;

  var prev = DR.positionHistory[DR.positionHistory.length - 2];
  var curr = DR.positionHistory[DR.positionHistory.length - 1];
  var dt = (curr.ts - prev.ts) / 1000; // seconds between fixes
  if (dt < 0.5) return; // too fast, skip

  var alerts = [];

  // Check 1: Position jump
  var jumpDist = haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon);
  if (jumpDist > SPOOF_JUMP_THRESHOLD_M && dt < 10) {
    alerts.push('POSITION JUMP: ' + (jumpDist / 1852).toFixed(2) + ' nm in ' + dt.toFixed(0) + 's');
  }

  // Check 2: Speed sanity (calculated from position change)
  var calcSpeedKn = (jumpDist / dt) * 1.94384; // m/s to knots
  if (calcSpeedKn > SPOOF_SPEED_THRESHOLD_KN && dt > 1) {
    alerts.push('IMPOSSIBLE SPEED: ' + calcSpeedKn.toFixed(0) + ' kn calculated');
  }

  // Check 3: Reported speed sanity
  if (curr.spdMS != null) {
    var reportedKn = curr.spdMS * 1.94384;
    if (reportedKn > SPOOF_SPEED_THRESHOLD_KN) {
      alerts.push('GPS SPEED ANOMALY: ' + reportedKn.toFixed(0) + ' kn reported');
    }
  }

  // Check 4: Altitude at sea (should be near 0)
  if (curr.alt != null && Math.abs(curr.alt) > SPOOF_ALT_THRESHOLD_M) {
    alerts.push('ALTITUDE ANOMALY: ' + curr.alt.toFixed(0) + 'm (at sea?)');
  }

  // Check 5: COG vs compass heading (while moving)
  if (curr.compassHdg != null && curr.cog != null && curr.spdMS != null && curr.spdMS > 1) {
    var trueHdg = curr.compassHdg;
    if (STATE.magVar != null) trueHdg = (curr.compassHdg + STATE.magVar + 360) % 360;
    var hdgDiff = Math.abs(trueHdg - curr.cog);
    if (hdgDiff > 180) hdgDiff = 360 - hdgDiff;
    if (hdgDiff > SPOOF_HEADING_MISMATCH_DEG) {
      alerts.push('HEADING MISMATCH: GPS COG ' + curr.cog.toFixed(0) + '° vs Compass ' + trueHdg.toFixed(0) + '°T');
    }
  }

  // If alerts detected → trigger spoofing warning
  if (alerts.length > 0) {
    DR.alerts = alerts;
    if (!DR.spoofingDetected) {
      triggerSpoofingAlert(alerts);
    }
    updateSpoofAlertDisplay(alerts);
  }
}

/* Trigger spoofing — save last good position and start DR */
function triggerSpoofingAlert(alerts) {
  DR.spoofingDetected = true;

  // Save the position BEFORE the jump as last good position
  if (DR.positionHistory.length >= 2 && !DR.lastGoodPosition) {
    var goodPos = DR.positionHistory[DR.positionHistory.length - 2];
    DR.lastGoodPosition = {
      lat: goodPos.lat, lon: goodPos.lon,
      timestamp: goodPos.ts, accuracy: 50
    };
    localStorage.setItem('navigps_dr_good_pos', JSON.stringify(DR.lastGoodPosition));
  }

  // Show spoofing banner
  var banner = document.getElementById('spoofingBanner');
  if (banner) banner.classList.add('show');

  // Show DR panel
  var panel = document.getElementById('drPanel');
  if (panel) panel.style.display = 'block';

  // Auto-start DR if not already running
  if (!DR.active) {
    startDeadReckoning();
  }
}

function updateSpoofAlertDisplay(alerts) {
  var el = document.getElementById('spoofAlertList');
  if (el) {
    el.innerHTML = alerts.map(function(a) {
      return '<div style="color:var(--danger);font-size:10px;font-weight:600;margin:1px 0">' + a + '</div>';
    }).join('');
  }
}

/* Start Dead Reckoning calculation */
function startDeadReckoning() {
  if (DR.active) return;
  DR.active = true;
  DR.manualDR = !DR.spoofingDetected; // track if user manually started
  DR.drStartTime = Date.now();
  DR.drUncertaintyNm = 0;

  // Use last good position or current position
  if (!DR.lastGoodPosition) {
    DR.lastGoodPosition = {
      lat: STATE.lat, lon: STATE.lon,
      timestamp: Date.now(), accuracy: STATE.accuracy || 50
    };
  }
  DR.drLat = DR.lastGoodPosition.lat;
  DR.drLon = DR.lastGoodPosition.lon;

  // Show UI
  var panel = document.getElementById('drPanel');
  if (panel) panel.style.display = 'block';
  document.getElementById('drBadge').classList.add('show');

  // Update DR position every second
  if (DR.drTimer) clearInterval(DR.drTimer);
  DR.drTimer = setInterval(updateDRPosition, 1000);
  updateDRPosition();
}

function stopDeadReckoning() {
  DR.active = false;
  DR.spoofingDetected = false;
  DR.lastGoodPosition = null;
  DR.drLat = null;
  DR.drLon = null;
  DR.alerts = [];
  DR.positionHistory = [];
  if (DR.drTimer) { clearInterval(DR.drTimer); DR.drTimer = null; }

  document.getElementById('drBadge').classList.remove('show');
  var banner = document.getElementById('spoofingBanner');
  if (banner) banner.classList.remove('show');
  localStorage.removeItem('navigps_dr_good_pos');
}

/* Calculate DR position from compass heading + speed */
function updateDRPosition() {
  if (!DR.active || !DR.lastGoodPosition) return;

  // Get heading (true) — prefer compass + variation over GPS COG
  var hdg = null;
  if (STATE.compassHeading != null) {
    hdg = STATE.compassHeading;
    if (STATE.magVar != null) hdg = (hdg + STATE.magVar + 360) % 360;
  } else if (STATE.cogGPS != null) {
    hdg = STATE.cogGPS; // fallback, but may be spoofed
  }

  // Get speed (m/s) — use last reported speed
  var spdMS = STATE.sogMS || 0;
  var spdKn = spdMS * 1.94384;

  // Time since DR started
  var elapsed = (Date.now() - DR.drStartTime) / 1000; // seconds
  // Time since last good position
  var totalElapsed = (Date.now() - DR.lastGoodPosition.timestamp) / 1000;

  // Calculate new position using rhumb line from last good position
  if (hdg != null && spdMS > 0) {
    var distM = spdMS * totalElapsed; // total distance traveled
    var distNm = distM / 1852;

    // Rhumb line calculation
    var latR = DR.lastGoodPosition.lat * Math.PI / 180;
    var hdgR = hdg * Math.PI / 180;
    var dLatR = (distM / 6371000) * Math.cos(hdgR);
    var newLatR = latR + dLatR;
    var dPsi = Math.log(Math.tan(newLatR / 2 + Math.PI / 4) / Math.tan(latR / 2 + Math.PI / 4));
    var q = Math.abs(dPsi) > 1e-12 ? dLatR / dPsi : Math.cos(latR);
    var dLonR = (distM / 6371000) * Math.sin(hdgR) / q;

    DR.drLat = newLatR * 180 / Math.PI;
    DR.drLon = DR.lastGoodPosition.lon + dLonR * 180 / Math.PI;

    // Uncertainty grows: ~2% of distance + 0.1nm per minute
    DR.drUncertaintyNm = distNm * 0.02 + (totalElapsed / 60) * 0.1;
  }

  // Update display
  updateDRDisplay(hdg, spdKn, elapsed, totalElapsed);
}

function updateDRDisplay(hdg, spdKn, elapsed, totalElapsed) {
  var fmt = getSettings().posFormat;

  var latEl = document.getElementById('drLat');
  var lonEl = document.getElementById('drLon');
  var hdgEl = document.getElementById('drHdg');
  var spdEl = document.getElementById('drSpd');
  var ageEl = document.getElementById('drAge');
  var uncEl = document.getElementById('drUncertainty');
  var srcEl = document.getElementById('drSource');

  if (latEl && DR.drLat != null) latEl.textContent = formatLat(DR.drLat, fmt);
  if (lonEl && DR.drLon != null) lonEl.textContent = formatLon(DR.drLon, fmt);
  if (hdgEl) hdgEl.textContent = hdg != null ? hdg.toFixed(1) + '°T' : '--';
  if (spdEl) spdEl.textContent = spdKn.toFixed(1) + ' kn';
  if (ageEl) {
    var min = Math.floor(totalElapsed / 60);
    var sec = Math.floor(totalElapsed % 60);
    ageEl.textContent = min + 'm ' + sec + 's';
    ageEl.style.color = min < 5 ? 'var(--accent)' : min < 15 ? 'var(--warning)' : 'var(--danger)';
  }
  if (uncEl) {
    uncEl.textContent = DR.drUncertaintyNm.toFixed(2) + ' nm';
    uncEl.style.color = DR.drUncertaintyNm < 0.5 ? 'var(--accent)' : DR.drUncertaintyNm < 2 ? 'var(--warning)' : 'var(--danger)';
  }
  if (srcEl) srcEl.textContent = STATE.compassHeading != null ? 'Compass + SOG' : 'GPS COG (may be spoofed)';

  // Update map DR marker if map exists
  updateDROnMap();
}

/* Show DR position on chart */
function updateDROnMap() {
  if (!STATE.map || DR.drLat == null) return;

  // DR marker (orange triangle)
  if (!STATE.drMarker) {
    var drIcon = L.divIcon({
      className: '',
      html: '<svg width="20" height="20" viewBox="0 0 20 20"><polygon points="10,2 4,18 10,14 16,18" fill="#ff8a00" stroke="#000" stroke-width="1" opacity="0.9"/></svg>' +
            '<div style="font-size:8px;color:#ff8a00;font-weight:700;text-align:center;margin-top:-2px;white-space:nowrap">DR POS</div>',
      iconSize: [20, 28], iconAnchor: [10, 14]
    });
    STATE.drMarker = L.marker([DR.drLat, DR.drLon], { icon: drIcon, zIndexOffset: 1000 }).addTo(STATE.map);
  } else {
    STATE.drMarker.setLatLng([DR.drLat, DR.drLon]);
  }

  // Uncertainty circle
  if (!STATE.drCircle) {
    STATE.drCircle = L.circle([DR.drLat, DR.drLon], {
      radius: DR.drUncertaintyNm * 1852,
      color: '#ff8a0066', fillColor: '#ff8a0022', weight: 2, dashArray: '6,4'
    }).addTo(STATE.map);
  } else {
    STATE.drCircle.setLatLng([DR.drLat, DR.drLon]);
    STATE.drCircle.setRadius(Math.max(100, DR.drUncertaintyNm * 1852));
  }
}

function removeDRFromMap() {
  if (STATE.drMarker && STATE.map) { STATE.map.removeLayer(STATE.drMarker); STATE.drMarker = null; }
  if (STATE.drCircle && STATE.map) { STATE.map.removeLayer(STATE.drCircle); STATE.drCircle = null; }
}

/* Manual DR: user can set last good position manually */
function setDRGoodPosition() {
  DR.lastGoodPosition = {
    lat: STATE.lat, lon: STATE.lon,
    timestamp: Date.now(), accuracy: STATE.accuracy || 50
  };
  DR.drStartTime = Date.now();
  DR.drUncertaintyNm = 0;
  DR.drLat = STATE.lat;
  DR.drLon = STATE.lon;
  localStorage.setItem('navigps_dr_good_pos', JSON.stringify(DR.lastGoodPosition));

  var el = document.getElementById('drGoodPosLabel');
  if (el) el.textContent = 'Saved: ' + formatLat(STATE.lat, 'dm') + ' ' + formatLon(STATE.lon, 'dm');
}

/* Use DR position as ship position (overrides GPS) */
function useDRPosition() {
  if (DR.drLat != null && DR.drLon != null) {
    STATE.manualLat = DR.drLat;
    STATE.manualLon = DR.drLon;
    STATE.manualMode = true;
    document.getElementById('manualBadge').classList.add('show');
    refreshAllDisplays();
  }
}

/* Restore DR state from localStorage on page load */
function restoreDR() {
  try {
    var saved = localStorage.getItem('navigps_dr_good_pos');
    if (saved) {
      DR.lastGoodPosition = JSON.parse(saved);
      var el = document.getElementById('drGoodPosLabel');
      if (el && DR.lastGoodPosition) {
        el.textContent = 'Saved: ' + formatLat(DR.lastGoodPosition.lat, 'dm') + ' ' + formatLon(DR.lastGoodPosition.lon, 'dm');
      }
    }
  } catch(e) {}
}
