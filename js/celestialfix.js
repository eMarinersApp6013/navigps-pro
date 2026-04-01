/* ============================================================
   CELESTIAL FIX CALCULATOR — Sight Reduction
   Marcq Saint-Hilaire intercept method.
   Enter sextant observations → get position lines → fix.
   Works completely independent of GPS.
   ============================================================ */

var SIGHTS = [];  // stored sight observations
var celestialFixResult = null;

/* Add a sight observation */
function addSight() {
  var body = document.getElementById('sightBody').value;
  var hsD = parseFloat(document.getElementById('sightHsDeg').value);
  var hsM = parseFloat(document.getElementById('sightHsMin').value) || 0;
  var timeH = parseInt(document.getElementById('sightTimeH').value);
  var timeM = parseInt(document.getElementById('sightTimeM').value);
  var timeS = parseInt(document.getElementById('sightTimeS').value) || 0;
  var ie = parseFloat(document.getElementById('sightIE').value) || 0; // index error in arcminutes
  var limb = document.getElementById('sightLimb').value; // 'lower' or 'upper'
  var hoe = parseFloat(document.getElementById('heightOfEye').value) || 15;

  if (isNaN(hsD) || isNaN(timeH) || isNaN(timeM)) {
    document.getElementById('sightStatus').textContent = 'Enter Hs, time (UTC)';
    document.getElementById('sightStatus').style.color = 'var(--danger)';
    return;
  }

  // Sextant altitude in decimal degrees
  var hs = hsD + hsM / 60;

  // Build UTC time for the observation
  var now = new Date();
  var obsTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), timeH, timeM, timeS));

  // Apply corrections to get Ho (observed altitude)
  // 1. Index error
  var correctedHs = hs + ie / 60; // IE in arcminutes → degrees

  // 2. Dip correction: dip = 1.76 * sqrt(hoe) arcminutes
  var dip = 1.76 * Math.sqrt(hoe);
  var apparentAlt = correctedHs - dip / 60;

  // 3. Refraction correction (standard atmosphere)
  var refraction = 0;
  if (apparentAlt > -1) {
    refraction = 1.0 / Math.tan((apparentAlt + 7.31 / (apparentAlt + 4.4)) * Math.PI / 180);
  }
  var ho = apparentAlt - refraction / 60;

  // 4. Semi-diameter (for Sun and Moon)
  if (body === 'Sun') {
    var sd = 16.0 / 60; // degrees
    if (limb === 'lower') ho += sd;
    else if (limb === 'upper') ho -= sd;
  } else if (body === 'Moon') {
    var sd = 15.5 / 60; // approximate
    if (limb === 'lower') ho += sd;
    else if (limb === 'upper') ho -= sd;
  }

  // Get assumed position (use current GPS or DR or manual position)
  var apLat = STATE.manualMode && STATE.manualLat != null ? STATE.manualLat : (STATE.lat || 25.0);
  var apLon = STATE.manualMode && STATE.manualLon != null ? STATE.manualLon : (STATE.lon || 55.0);

  // If DR is running, use DR position as assumed position
  if (DR.active && DR.drLat != null) {
    apLat = DR.drLat;
    apLon = DR.drLon;
  }

  // Calculate Hc (computed altitude) and Zn (azimuth) using Astronomy library
  var hc, zn;
  try {
    var date = Astronomy.MakeTime(obsTime);
    var observer = new Astronomy.Observer(apLat, apLon, hoe);

    if (body === 'Sun' || body === 'Moon' || body === 'Venus' || body === 'Mars' || body === 'Jupiter' || body === 'Saturn') {
      var hor = getBodyHorizon(date, observer, body);
      hc = hor.altitude;
      zn = hor.azimuth;
    } else {
      // Star — find it in NAV_STARS
      var star = NAV_STARS.find(function(s) { return s[0] === body; });
      if (!star) {
        document.getElementById('sightStatus').textContent = 'Star not found: ' + body;
        document.getElementById('sightStatus').style.color = 'var(--danger)';
        return;
      }
      var siderealTime = Astronomy.SiderealTime(date);
      var pos = calcStarAzAlt(star[1], star[2], apLat, apLon, siderealTime);
      hc = pos.alt;
      zn = pos.az;
    }
  } catch(e) {
    document.getElementById('sightStatus').textContent = 'Calculation error: ' + e.message;
    document.getElementById('sightStatus').style.color = 'var(--danger)';
    return;
  }

  // Intercept = Ho - Hc (in arcminutes = nautical miles)
  var intercept = (ho - hc) * 60; // nautical miles

  var sight = {
    body: body,
    hs: hs,
    ho: ho,
    hc: hc,
    zn: zn,
    intercept: intercept,
    obsTime: obsTime,
    apLat: apLat,
    apLon: apLon,
    dip: dip,
    refraction: refraction,
    ie: ie,
    limb: limb
  };

  SIGHTS.push(sight);
  updateSightsDisplay();

  document.getElementById('sightStatus').textContent = 'Sight added: ' + body + ' | Intercept: ' + intercept.toFixed(1) + "' " + (intercept >= 0 ? 'TOWARDS' : 'AWAY');
  document.getElementById('sightStatus').style.color = 'var(--accent)';

  // If 2+ sights, try to calculate fix
  if (SIGHTS.length >= 2) {
    calculateCelestialFix();
  }
}

/* Calculate fix from 2+ sights using intercept method */
function calculateCelestialFix() {
  if (SIGHTS.length < 2) return;

  // Use last 2 sights for a 2-body fix
  // For 3+ sights, use least squares
  var s1 = SIGHTS[SIGHTS.length - 2];
  var s2 = SIGHTS[SIGHTS.length - 1];

  // Each sight gives a position line:
  // From AP, move 'intercept' nm along azimuth Zn → that's a point on the position line
  // Position line is perpendicular to Zn at that point

  // Solve intersection of two position lines
  // Using the Marcq Saint-Hilaire method:
  // Convert each sight to: lat/lon displacement from AP

  // Position line 1: perpendicular to Zn1 at distance intercept1 from AP
  // Position line 2: perpendicular to Zn2 at distance intercept2 from AP
  var zn1R = s1.zn * Math.PI / 180;
  var zn2R = s2.zn * Math.PI / 180;
  var i1 = s1.intercept; // nm
  var i2 = s2.intercept; // nm

  // Solve simultaneous equations:
  // dLat * cos(Zn1) + dLon * cos(apLat) * sin(Zn1) = i1
  // dLat * cos(Zn2) + dLon * cos(apLat) * sin(Zn2) = i2
  // where dLat, dLon are in arcminutes

  var a11 = Math.cos(zn1R);
  var a12 = Math.sin(zn1R) * Math.cos(s1.apLat * Math.PI / 180);
  var a21 = Math.cos(zn2R);
  var a22 = Math.sin(zn2R) * Math.cos(s2.apLat * Math.PI / 180);

  var det = a11 * a22 - a12 * a21;

  if (Math.abs(det) < 0.001) {
    document.getElementById('fixResult').textContent = 'Position lines too parallel — need different azimuths (>30° apart)';
    document.getElementById('fixResult').style.color = 'var(--warning)';
    return;
  }

  var dLat = (i1 * a22 - i2 * a12) / det; // arcminutes
  var dLon = (a11 * i2 - a21 * i1) / det; // arcminutes

  var fixLat = s1.apLat + dLat / 60;
  var fixLon = s1.apLon + dLon / 60;

  celestialFixResult = { lat: fixLat, lon: fixLon, sights: [s1, s2] };

  // Display result
  var fmt = getSettings().posFormat;
  var resultEl = document.getElementById('fixResult');
  resultEl.innerHTML = '<div style="text-align:center;padding:8px">' +
    '<div style="font-size:10px;color:var(--text-secondary);letter-spacing:1px;margin-bottom:4px">CELESTIAL FIX (GPS-INDEPENDENT)</div>' +
    '<div class="mono" style="font-size:22px;font-weight:700;color:#ffd54f">' + formatLat(fixLat, fmt) + '</div>' +
    '<div class="mono" style="font-size:22px;font-weight:700;color:#ffd54f">' + formatLon(fixLon, fmt) + '</div>' +
    '<div style="font-size:10px;color:var(--text-secondary);margin-top:6px">' +
    s1.body + ' Zn ' + s1.zn.toFixed(1) + '° Int ' + s1.intercept.toFixed(1) + "' | " +
    s2.body + ' Zn ' + s2.zn.toFixed(1) + '° Int ' + s2.intercept.toFixed(1) + "'" +
    '</div>' +
    '<div style="display:flex;gap:8px;justify-content:center;margin-top:8px">' +
    '<button class="btn btn-sm btn-primary" onclick="useCelestialFix()">Use as Position</button>' +
    '<button class="btn btn-sm" onclick="showFixOnChart()">Show on Chart</button>' +
    '</div>' +
    '</div>';

  // Calculate distance from GPS position to fix
  if (STATE.lat != null) {
    var distToGPS = haversineDistance(fixLat, fixLon, STATE.lat, STATE.lon);
    var distNM = distToGPS / 1852;
    resultEl.innerHTML += '<div style="margin-top:8px;padding:6px;border-radius:4px;' +
      (distNM > 1 ? 'background:#ff3d3d22;color:#ff4444' : 'background:#00e67622;color:#00e676') + ';font-size:11px;text-align:center;font-weight:600">' +
      'Distance from GPS position: ' + distNM.toFixed(2) + ' nm' +
      (distNM > 1 ? ' — GPS LIKELY SPOOFED' : ' — GPS appears correct') +
      '</div>';
  }
}

/* Use celestial fix as manual position */
function useCelestialFix() {
  if (!celestialFixResult) return;
  STATE.manualLat = celestialFixResult.lat;
  STATE.manualLon = celestialFixResult.lon;
  STATE.manualMode = true;
  document.getElementById('manualBadge').classList.add('show');
  refreshAllDisplays();
}

/* Show fix on chart */
function showFixOnChart() {
  if (!celestialFixResult || !STATE.map) {
    // Switch to chart tab first
    var chartBtn = document.querySelectorAll('.nav-btn')[1];
    if (chartBtn) chartBtn.click();
    setTimeout(showFixOnChart, 500);
    return;
  }
  var fix = celestialFixResult;

  // Add fix marker
  if (STATE.celestialFixMarker) STATE.map.removeLayer(STATE.celestialFixMarker);
  var fixIcon = L.divIcon({
    className: '',
    html: '<div style="text-align:center"><svg width="16" height="16" viewBox="0 0 16 16"><polygon points="8,1 1,15 15,15" fill="none" stroke="#ffd54f" stroke-width="2"/><circle cx="8" cy="10" r="2" fill="#ffd54f"/></svg>' +
          '<div style="font-size:8px;color:#ffd54f;font-weight:700;white-space:nowrap">CEL FIX</div></div>',
    iconSize: [16, 24], iconAnchor: [8, 12]
  });
  STATE.celestialFixMarker = L.marker([fix.lat, fix.lon], { icon: fixIcon, zIndexOffset: 1000 }).addTo(STATE.map);
  STATE.map.flyTo([fix.lat, fix.lon], 12, { duration: 1 });
}

/* Display sights list */
function updateSightsDisplay() {
  var el = document.getElementById('sightsList');
  if (!el) return;
  if (SIGHTS.length === 0) {
    el.innerHTML = '<div style="color:var(--text-dim);font-size:10px">No sights recorded</div>';
    return;
  }
  el.innerHTML = SIGHTS.map(function(s, i) {
    var dir = s.intercept >= 0 ? 'T' : 'A'; // Towards or Away
    var timeStr = s.obsTime.getUTCHours().toString().padStart(2, '0') + ':' +
                  s.obsTime.getUTCMinutes().toString().padStart(2, '0') + ':' +
                  s.obsTime.getUTCSeconds().toString().padStart(2, '0');
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px solid var(--border);font-size:10px">' +
      '<span style="color:#ffd54f;font-weight:600;width:60px">' + s.body + '</span>' +
      '<span class="mono">Ho:' + s.ho.toFixed(2) + '°</span>' +
      '<span class="mono">Hc:' + s.hc.toFixed(2) + '°</span>' +
      '<span class="mono">Zn:' + s.zn.toFixed(1) + '°</span>' +
      '<span class="mono" style="color:' + (Math.abs(s.intercept) > 10 ? 'var(--warning)' : 'var(--accent)') + '">' + Math.abs(s.intercept).toFixed(1) + "'" + dir + '</span>' +
      '<span class="mono" style="color:var(--text-dim)">' + timeStr + '</span>' +
      '<button onclick="removeSight(' + i + ')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px;padding:0 4px">&times;</button>' +
      '</div>';
  }).join('');
}

function removeSight(index) {
  SIGHTS.splice(index, 1);
  updateSightsDisplay();
  document.getElementById('fixResult').innerHTML = '';
  if (SIGHTS.length >= 2) calculateCelestialFix();
}

function clearAllSights() {
  SIGHTS = [];
  celestialFixResult = null;
  updateSightsDisplay();
  document.getElementById('fixResult').innerHTML = '';
  if (STATE.celestialFixMarker && STATE.map) {
    STATE.map.removeLayer(STATE.celestialFixMarker);
    STATE.celestialFixMarker = null;
  }
}

/* Auto-fill current time */
function fillCurrentTime() {
  var now = new Date();
  document.getElementById('sightTimeH').value = now.getUTCHours();
  document.getElementById('sightTimeM').value = now.getUTCMinutes();
  document.getElementById('sightTimeS').value = now.getUTCSeconds();
}

/* Populate body dropdown with visible bodies */
function populateSightBodies() {
  var sel = document.getElementById('sightBody');
  if (!sel) return;
  sel.innerHTML = '<option value="Sun">Sun</option><option value="Moon">Moon</option>' +
    '<option value="Venus">Venus</option><option value="Mars">Mars</option>' +
    '<option value="Jupiter">Jupiter</option><option value="Saturn">Saturn</option>';

  // Add navigational stars
  NAV_STARS.forEach(function(s) {
    sel.innerHTML += '<option value="' + s[0] + '">' + s[0] + ' (' + s[4] + ')</option>';
  });
}
