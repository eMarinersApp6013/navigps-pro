/* ============================================================
   POSITION FORMATTING & UI UPDATES
   ============================================================ */
function formatLat(deg, fmt) {
  if (deg == null) return '--\u00B0--.---\'N';
  const ns = deg >= 0 ? 'N' : 'S';
  const a = Math.abs(deg);
  if (fmt === 'dd') return a.toFixed(5) + '\u00B0' + ns;
  const d = Math.floor(a);
  const m = (a - d) * 60;
  if (fmt === 'dms') {
    const mi = Math.floor(m);
    const s = (m - mi) * 60;
    return d.toString().padStart(2,'0') + '\u00B0' + mi.toString().padStart(2,'0') + '\'' + s.toFixed(1).padStart(4,'0') + '"' + ns;
  }
  return d.toString().padStart(2,'0') + '\u00B0' + m.toFixed(3).padStart(6,'0') + '\'' + ns;
}

function formatLon(deg, fmt) {
  if (deg == null) return '---\u00B0--.---\'E';
  const ew = deg >= 0 ? 'E' : 'W';
  const a = Math.abs(deg);
  if (fmt === 'dd') return a.toFixed(5) + '\u00B0' + ew;
  const d = Math.floor(a);
  const m = (a - d) * 60;
  if (fmt === 'dms') {
    const mi = Math.floor(m);
    const s = (m - mi) * 60;
    return d.toString().padStart(3,'0') + '\u00B0' + mi.toString().padStart(2,'0') + '\'' + s.toFixed(1).padStart(4,'0') + '"' + ew;
  }
  return d.toString().padStart(3,'0') + '\u00B0' + m.toFixed(3).padStart(6,'0') + '\'' + ew;
}

function updateDisplay() {
  const s = getSettings();
  const fmt = s.posFormat;

  // Determine which position to show (manual override or GPS/frozen)
  let displayLat = STATE.lat;
  let displayLon = STATE.lon;

  if (STATE.manualMode && STATE.manualLat != null) {
    displayLat = STATE.manualLat;
    displayLon = STATE.manualLon;
  }

  document.getElementById('latDisplay').textContent = formatLat(displayLat, fmt);
  document.getElementById('lonDisplay').textContent = formatLon(displayLon, fmt);

  // Accuracy
  const acc = STATE.accuracy;
  if (acc != null) {
    document.getElementById('accLabel').textContent = 'Accuracy: ' + acc.toFixed(1) + 'm';
    const threshold = parseInt(s.accThreshold) || 50;
    const pct = Math.min(100, Math.max(5, (1 - acc / (threshold * 2)) * 100));
    const fill = document.getElementById('accFill');
    fill.style.width = pct + '%';
    fill.style.background = acc < threshold / 2 ? 'var(--accent)' : acc < threshold ? 'var(--warning)' : 'var(--danger)';
  }

  // Altitude
  document.getElementById('altLabel').textContent = STATE.alt != null ? 'Alt: ' + STATE.alt.toFixed(0) + 'm' : 'Alt: --';

  // COG / SOG
  const cog = STATE.cogGPS;
  document.getElementById('cogDisplay').textContent = cog != null ? cog.toFixed(1).padStart(5, '0') : '---.-';

  const sogKn = STATE.sogMS != null ? STATE.sogMS * 1.94384 : null;
  document.getElementById('sogDisplay').textContent = sogKn != null ? sogKn.toFixed(1) : '--.--';

  // Compass
  const hdg = STATE.compassHeading;
  document.getElementById('hdgDisplay').textContent = hdg != null ? hdg.toFixed(1).padStart(5, '0') : '---.-';

  // Rotate compass needle
  if (hdg != null) {
    document.getElementById('compassNeedle').setAttribute('transform', 'rotate(' + (-hdg) + ', 100, 100)');
  }

  // Magnetic Variation
  if (STATE.magVar != null) {
    const v = STATE.magVar;
    document.getElementById('varDisplay').textContent = Math.abs(v).toFixed(2);
    document.getElementById('varDir').textContent = v >= 0 ? '\u00B0E' : '\u00B0W';
  }

  // True Heading
  if (hdg != null && STATE.magVar != null) {
    const trueHdg = (hdg + STATE.magVar + 360) % 360;
    document.getElementById('trueHdgDisplay').textContent = trueHdg.toFixed(1).padStart(5, '0');
  }

  // Timestamp
  const now = new Date();
  document.getElementById('posTimestamp').textContent = now.toUTCString().slice(-12, -4);
}

/* ============================================================
   UTC CLOCK
   ============================================================ */
function updateClock() {
  const now = new Date();
  const h = now.getUTCHours().toString().padStart(2,'0');
  const m = now.getUTCMinutes().toString().padStart(2,'0');
  const s = now.getUTCSeconds().toString().padStart(2,'0');
  document.getElementById('utcClock').textContent = h + ':' + m + ':' + s + ' UTC';
}
