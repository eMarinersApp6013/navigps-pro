/* ============================================================
   MANUAL POSITION ENTRY
   ============================================================ */
function toggleManualBar() {
  var content = document.getElementById('manualContent');
  var arrow = document.getElementById('manualArrow');
  var isOpen = content.classList.contains('show');
  content.classList.toggle('show', !isOpen);
  arrow.textContent = isOpen ? '\u25BC' : '\u25B2';
}

function autoFormatManualCoord(input, type) {
  var raw = input.value.replace(/[^0-9.]/g, '');
  input.value = raw;

  var parsed = parseRawCoord(raw, type);
  var formatEl = document.getElementById(type === 'lat' ? 'manualLatFormatted' : 'manualLonFormatted');

  if (parsed !== null) {
    var deg = Math.floor(parsed);
    var min = (parsed - deg) * 60;
    if (type === 'lat') {
      formatEl.textContent = deg.toString().padStart(2, '0') + '\u00B0' + min.toFixed(3).padStart(6, '0') + "'";
    } else {
      formatEl.textContent = deg.toString().padStart(3, '0') + '\u00B0' + min.toFixed(3).padStart(6, '0') + "'";
    }
    formatEl.style.color = 'var(--accent)';
  } else {
    formatEl.textContent = type === 'lat' ? "--\u00B0--.---'" : "---\u00B0--.---'";
    formatEl.style.color = 'var(--text-dim)';
  }
}

function setManualPosition() {
  var latRaw = document.getElementById('manualLatInput').value.replace(/[^0-9.]/g, '');
  var lonRaw = document.getElementById('manualLonInput').value.replace(/[^0-9.]/g, '');
  var latDir = document.getElementById('manualLatNS').value;
  var lonDir = document.getElementById('manualLonEW').value;

  var lat = parseRawCoord(latRaw, 'lat');
  var lon = parseRawCoord(lonRaw, 'lon');

  if (lat == null || lon == null) {
    alert('Enter valid Lat and Lon values');
    return;
  }

  if (latDir === 'S') lat = -lat;
  if (lonDir === 'W') lon = -lon;

  STATE.manualMode = true;
  STATE.manualLat = lat;
  STATE.manualLon = lon;

  // Update mag variation for manual position
  STATE.magVar = calcMagVar(lat, lon, getDecimalYear());

  // Show MANUAL badge
  document.getElementById('manualBadge').classList.add('show');

  // Update all displays
  updateDisplay();
  updateMap();

  // Force map to center on manual position
  if (STATE.map) {
    STATE.map.setView([lat, lon], STATE.map.getZoom());
  }
}

function useGPSPosition() {
  STATE.manualMode = false;
  STATE.manualLat = null;
  STATE.manualLon = null;

  // Hide MANUAL badge
  document.getElementById('manualBadge').classList.remove('show');

  // Recalculate mag var with GPS position
  if (STATE.lat != null) {
    STATE.magVar = calcMagVar(STATE.lat, STATE.lon, getDecimalYear());
  }

  updateDisplay();
  updateMap();
}
