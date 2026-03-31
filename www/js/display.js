/* ============================================================
   POSITION FORMATTING & UI UPDATES
   ============================================================ */
function formatLat(deg, fmt) {
  if (deg == null) return '--\u00B0--.---\'N';
  var ns = deg >= 0 ? 'N' : 'S';
  var a = Math.abs(deg);
  if (fmt === 'dd') return a.toFixed(5) + '\u00B0' + ns;
  var d = Math.floor(a);
  var m = (a - d) * 60;
  if (fmt === 'dms') {
    var mi = Math.floor(m);
    var s = (m - mi) * 60;
    return d.toString().padStart(2,'0') + '\u00B0' + mi.toString().padStart(2,'0') + '\'' + s.toFixed(1).padStart(4,'0') + '"' + ns;
  }
  return d.toString().padStart(2,'0') + '\u00B0' + m.toFixed(3).padStart(6,'0') + '\'' + ns;
}

function formatLon(deg, fmt) {
  if (deg == null) return '---\u00B0--.---\'E';
  var ew = deg >= 0 ? 'E' : 'W';
  var a = Math.abs(deg);
  if (fmt === 'dd') return a.toFixed(5) + '\u00B0' + ew;
  var d = Math.floor(a);
  var m = (a - d) * 60;
  if (fmt === 'dms') {
    var mi = Math.floor(m);
    var s = (m - mi) * 60;
    return d.toString().padStart(3,'0') + '\u00B0' + mi.toString().padStart(2,'0') + '\'' + s.toFixed(1).padStart(4,'0') + '"' + ew;
  }
  return d.toString().padStart(3,'0') + '\u00B0' + m.toFixed(3).padStart(6,'0') + '\'' + ew;
}

function updateDisplay() {
  var s = getSettings();
  var fmt = s.posFormat;

  var displayLat = STATE.lat;
  var displayLon = STATE.lon;

  if (STATE.manualMode && STATE.manualLat != null) {
    displayLat = STATE.manualLat;
    displayLon = STATE.manualLon;
  }

  document.getElementById('latDisplay').textContent = formatLat(displayLat, fmt);
  document.getElementById('lonDisplay').textContent = formatLon(displayLon, fmt);

  // Accuracy
  var acc = STATE.accuracy;
  if (acc != null) {
    document.getElementById('accLabel').textContent = 'Accuracy: ' + acc.toFixed(1) + 'm';
    var threshold = parseInt(s.accThreshold) || 50;
    var pct = Math.min(100, Math.max(5, (1 - acc / (threshold * 2)) * 100));
    var fill = document.getElementById('accFill');
    fill.style.width = pct + '%';
    fill.style.background = acc < threshold / 2 ? 'var(--accent)' : acc < threshold ? 'var(--warning)' : 'var(--danger)';
  }

  // Altitude
  document.getElementById('altLabel').textContent = STATE.alt != null ? 'Alt: ' + STATE.alt.toFixed(0) + 'm' : 'Alt: --';

  // COG / SOG
  var cog = STATE.cogGPS;
  document.getElementById('cogDisplay').textContent = cog != null ? cog.toFixed(1).padStart(5, '0') : '---.-';

  var sogKn = STATE.sogMS != null ? STATE.sogMS * 1.94384 : null;
  document.getElementById('sogDisplay').textContent = sogKn != null ? sogKn.toFixed(1) : '--.--';

  // Compass
  var hdg = STATE.compassHeading;
  document.getElementById('hdgDisplay').textContent = hdg != null ? hdg.toFixed(1).padStart(5, '0') : '---.-';

  if (hdg != null) {
    document.getElementById('compassNeedle').setAttribute('transform', 'rotate(' + (-hdg) + ', 100, 100)');
  }

  // Magnetic Variation
  if (STATE.magVar != null) {
    var v = STATE.magVar;
    document.getElementById('varDisplay').textContent = Math.abs(v).toFixed(2);
    document.getElementById('varDir').textContent = v >= 0 ? '\u00B0E' : '\u00B0W';
  }

  // True Heading
  if (hdg != null && STATE.magVar != null) {
    var trueHdg = (hdg + STATE.magVar + 360) % 360;
    document.getElementById('trueHdgDisplay').textContent = trueHdg.toFixed(1).padStart(5, '0');
  }

  // Timestamp
  var now = new Date();
  document.getElementById('posTimestamp').textContent = now.toUTCString().slice(-12, -4);
}

/* ============================================================
   UTC CLOCK
   ============================================================ */
function updateClock() {
  var now = new Date();
  var h = now.getUTCHours().toString().padStart(2,'0');
  var m = now.getUTCMinutes().toString().padStart(2,'0');
  var s = now.getUTCSeconds().toString().padStart(2,'0');
  document.getElementById('utcClock').textContent = h + ':' + m + ':' + s + ' UTC';
}

/* ============================================================
   HAVERSINE HELPERS (shared)
   ============================================================ */
function haversineDistance(lat1, lon1, lat2, lon2) {
  var R = 6371000;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = Math.pow(Math.sin(dLat/2), 2) +
          Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
          Math.pow(Math.sin(dLon/2), 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function haversineBearing(lat1, lon1, lat2, lon2) {
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  var x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
          Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
