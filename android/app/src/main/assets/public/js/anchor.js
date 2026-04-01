/* ============================================================
   ANCHOR WATCH
   ============================================================ */
function dropAnchor() {
  if (STATE.lat == null) { alert('No GPS position!'); return; }
  STATE.anchorPosition = { lat: STATE.lat, lon: STATE.lon };
  STATE.anchorRadius = parseInt(document.getElementById('anchorRadiusSlider').value) || 100;
  STATE.anchorWatchActive = true;
  STATE.anchorAlarm = false;

  // Add anchor marker + circle on chart
  if (STATE.map) {
    removeAnchorOverlay();
    var anchorIcon = L.divIcon({
      className: '',
      html: '<svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)" stroke="#000" stroke-width="1"><path d="M12 2a3 3 0 00-3 3c0 1.3.8 2.4 2 2.8V11H8v2h3v6.9A8 8 0 014 12H2a10 10 0 0020 0h-2a8 8 0 01-7 7.9V13h3v-2h-3V7.8A3 3 0 0012 2z"/></svg>',
      iconSize: [20, 20], iconAnchor: [10, 10]
    });
    STATE.anchorMarker = L.marker([STATE.anchorPosition.lat, STATE.anchorPosition.lon], { icon: anchorIcon }).addTo(STATE.map);
    STATE.anchorCircle = L.circle([STATE.anchorPosition.lat, STATE.anchorPosition.lon], {
      radius: STATE.anchorRadius, color: '#00e676', fillColor: '#00e67622', weight: 2, dashArray: '6,4'
    }).addTo(STATE.map);
  }

  document.getElementById('anchorWatchPanel').style.display = 'block';
  document.getElementById('dropAnchorBtn').style.display = 'none';
  document.getElementById('weighAnchorBtn').style.display = 'inline-block';
  updateAnchorDisplay();
}

function weighAnchor() {
  STATE.anchorWatchActive = false;
  STATE.anchorPosition = null;
  STATE.anchorAlarm = false;
  removeAnchorOverlay();
  document.getElementById('anchorWatchPanel').style.display = 'none';
  document.getElementById('dropAnchorBtn').style.display = 'inline-block';
  document.getElementById('weighAnchorBtn').style.display = 'none';
  document.getElementById('anchorAlarmBanner').classList.remove('show');
  // Stop vibration
  if (navigator.vibrate) navigator.vibrate(0);
}

function removeAnchorOverlay() {
  if (STATE.anchorMarker && STATE.map) { STATE.map.removeLayer(STATE.anchorMarker); STATE.anchorMarker = null; }
  if (STATE.anchorCircle && STATE.map) { STATE.map.removeLayer(STATE.anchorCircle); STATE.anchorCircle = null; }
}

function updateAnchorRadius(val) {
  STATE.anchorRadius = parseInt(val);
  document.getElementById('anchorRadiusLabel').textContent = val + 'm';
  if (STATE.anchorCircle) STATE.anchorCircle.setRadius(STATE.anchorRadius);
}

function checkAnchorAlarm() {
  if (!STATE.anchorWatchActive || !STATE.anchorPosition || STATE.lat == null) return;
  var dist = haversineDistance(STATE.lat, STATE.lon, STATE.anchorPosition.lat, STATE.anchorPosition.lon);
  if (dist > STATE.anchorRadius && !STATE.anchorAlarm) {
    STATE.anchorAlarm = true;
    document.getElementById('anchorAlarmBanner').classList.add('show');
    document.getElementById('anchorAlarmDist').textContent = Math.round(dist - STATE.anchorRadius) + 'm outside';
    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
  } else if (dist <= STATE.anchorRadius && STATE.anchorAlarm) {
    STATE.anchorAlarm = false;
    document.getElementById('anchorAlarmBanner').classList.remove('show');
    if (navigator.vibrate) navigator.vibrate(0);
  }
}

function updateAnchorDisplay() {
  if (!STATE.anchorWatchActive || !STATE.anchorPosition || STATE.lat == null) return;
  var dist = haversineDistance(STATE.lat, STATE.lon, STATE.anchorPosition.lat, STATE.anchorPosition.lon);
  var brg = haversineBearing(STATE.lat, STATE.lon, STATE.anchorPosition.lat, STATE.anchorPosition.lon);
  document.getElementById('anchorDist').textContent = dist.toFixed(0) + 'm';
  document.getElementById('anchorBrg').textContent = brg.toFixed(1) + '\u00B0';
  document.getElementById('anchorDistBar').style.width = Math.min(100, (dist / STATE.anchorRadius) * 100) + '%';
  document.getElementById('anchorDistBar').style.background = dist < STATE.anchorRadius * 0.7 ? 'var(--accent)' : dist < STATE.anchorRadius ? 'var(--warning)' : 'var(--danger)';
}
