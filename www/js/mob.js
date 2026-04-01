/* ============================================================
   MOB (Man Overboard) Button
   ============================================================ */
function triggerMOB() {
  if (STATE.lat == null) { alert('No GPS position available!'); return; }

  STATE.mobPosition = { lat: STATE.lat, lon: STATE.lon, timestamp: Date.now() };
  localStorage.setItem('navigps_mob', JSON.stringify(STATE.mobPosition));

  // Vibrate
  if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);

  // Flash screen red
  document.getElementById('mobFlash').classList.add('show');
  setTimeout(function() { document.getElementById('mobFlash').classList.remove('show'); }, 2000);

  // Add marker on chart
  addMOBMarker();

  // Show MOB info panel
  document.getElementById('mobInfoPanel').style.display = 'block';
  updateMOBDistance();
}

function addMOBMarker() {
  if (!STATE.map || !STATE.mobPosition) return;
  removeMOBMarker();

  var mobIcon = L.divIcon({
    className: '',
    html: '<div style="width:20px;height:20px;background:#ff0000;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px #ff0000;animation:mobBlink 0.5s infinite"></div>',
    iconSize: [20, 20], iconAnchor: [10, 10]
  });
  STATE.mobMarker = L.marker([STATE.mobPosition.lat, STATE.mobPosition.lon], { icon: mobIcon }).addTo(STATE.map);
  STATE.mobMarker.bindTooltip('MOB', { permanent: true, className: 'mob-tooltip' });

  STATE.mobLine = L.polyline([], { color: '#ff0000', weight: 2, dashArray: '8,4' }).addTo(STATE.map);
}

function removeMOBMarker() {
  if (STATE.mobMarker && STATE.map) { STATE.map.removeLayer(STATE.mobMarker); STATE.mobMarker = null; }
  if (STATE.mobLine && STATE.map) { STATE.map.removeLayer(STATE.mobLine); STATE.mobLine = null; }
}

function updateMOBDistance() {
  if (!STATE.mobPosition || STATE.lat == null) return;
  var dist = haversineDistance(STATE.lat, STATE.lon, STATE.mobPosition.lat, STATE.mobPosition.lon);
  var brg = haversineBearing(STATE.lat, STATE.lon, STATE.mobPosition.lat, STATE.mobPosition.lon);
  var distNM = dist / 1852;

  document.getElementById('mobDist').textContent = dist < 1000 ? dist.toFixed(0) + 'm' : distNM.toFixed(2) + ' NM';
  document.getElementById('mobBrg').textContent = brg.toFixed(1) + '\u00B0T';

  var ts = new Date(STATE.mobPosition.timestamp);
  document.getElementById('mobTime').textContent = ts.getUTCHours().toString().padStart(2,'0') + ':' +
    ts.getUTCMinutes().toString().padStart(2,'0') + ':' + ts.getUTCSeconds().toString().padStart(2,'0') + ' UTC';
}

function clearMOB() {
  if (!confirm('Clear MOB position?')) return;
  STATE.mobPosition = null;
  localStorage.removeItem('navigps_mob');
  removeMOBMarker();
  document.getElementById('mobInfoPanel').style.display = 'none';
}

function restoreMOB() {
  try {
    var saved = JSON.parse(localStorage.getItem('navigps_mob'));
    if (saved && saved.lat) {
      STATE.mobPosition = saved;
      document.getElementById('mobInfoPanel').style.display = 'block';
      // Marker will be added when map is initialized
    }
  } catch(e) {}
}

function goToMOB() {
  if (STATE.mobPosition && STATE.map) {
    STATE.map.setView([STATE.mobPosition.lat, STATE.mobPosition.lon], 16);
    switchTab('chart', document.querySelectorAll('.nav-btn')[1]);
  }
}
