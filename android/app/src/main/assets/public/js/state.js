/* ============================================================
   GLOBAL STATE & SETTINGS
   ============================================================ */
var STATE = {
  lat: null, lon: null, alt: null, accuracy: null,
  speed: null, heading: null, cogGPS: null, sogMS: null,
  compassHeading: null, magVar: null,
  watchId: null, wakeLockSentinel: null,
  map: null, marker: null, trackLine: null, trackPoints: [],
  seamarkLayer: null, depthLayer: null, portLayer: null,
  peer: null, conn: null,
  isSharing: false, isReceiving: false,
  // GPS freeze state
  gpsLost: false,
  lastKnown: null,
  lastGpsTimestamp: null, // ms since epoch of last GPS fix
  gpsWatchdogTimer: null,
  gpsAgeTimer: null,
  // Manual position mode
  manualMode: false,
  manualLat: null,
  manualLon: null,
  // Wake lock
  noSleepVideo: null,
  wakeLockActive: false,
  // Remote mode
  remoteMode: false,
  remoteCode: null,
  // MOB
  mobPosition: null, // { lat, lon, timestamp }
  mobMarker: null,
  mobLine: null,
  // Anchor watch
  anchorPosition: null, // { lat, lon }
  anchorRadius: 100,
  anchorCircle: null,
  anchorMarker: null,
  anchorAlarm: false,
  anchorWatchActive: false,
  // Weather
  weatherData: null,
  weatherLastFetch: 0,
  // Search
  searchTimeout: null,
  // Depth at ship position
  depthAtShip: null,
  depthLabel: null,
  // Dead Reckoning map objects
  drMarker: null,
  drCircle: null,
  // Celestial fix
  celestialFixMarker: null,
  // IP Geolocation
  ipGeoMarker: null,
  ipGeoCircle: null
};

function getSettings() {
  var defaults = {
    nightMode: false, wakeLock: true, posFormat: 'dm',
    accThreshold: '50', seamarks: true, trackTrail: true,
    celestialHdg: '0', heightOfEye: '15',
    depthLayer: true, anchorages: true
  };
  try {
    var saved = JSON.parse(localStorage.getItem('navigps_settings') || '{}');
    return Object.assign({}, defaults, saved);
  } catch(e) { return defaults; }
}

function saveSetting(key, value) {
  var s = getSettings();
  s[key] = value;
  localStorage.setItem('navigps_settings', JSON.stringify(s));
}

function toggleSetting(key, el) {
  var s = getSettings();
  var newVal = !s[key];
  saveSetting(key, newVal);
  el.classList.toggle('on', newVal);
  if (key === 'nightMode') applyTheme();
  if (key === 'wakeLock') {
    if (newVal) { requestWakeLock(); } else { releaseAllWakeLocks(); }
  }
}

function applySettings() {
  var s = getSettings();
  document.getElementById('toggleNight').classList.toggle('on', s.nightMode);
  document.getElementById('toggleWake').classList.toggle('on', s.wakeLock);
  document.getElementById('toggleSeamarks').classList.toggle('on', s.seamarks);
  document.getElementById('toggleTrack').classList.toggle('on', s.trackTrail);
  document.getElementById('toggleDepth').classList.toggle('on', s.depthLayer);
  document.getElementById('posFormat').value = s.posFormat;
  document.getElementById('accThreshold').value = s.accThreshold;
  document.getElementById('celestialHdg').value = s.celestialHdg;
  document.getElementById('heightOfEye').value = s.heightOfEye;
  applyTheme();
  if (s.wakeLock) requestWakeLock();
  // Restore MOB from localStorage
  restoreMOB();
}

function applyTheme() {
  var s = getSettings();
  document.documentElement.setAttribute('data-theme', s.nightMode ? 'night' : 'default');
  document.querySelector('meta[name="theme-color"]').content = s.nightMode ? '#0a0000' : '#0a0e14';
}

function openSettings() { document.getElementById('settings-overlay').classList.add('show'); }
function closeSettings() { document.getElementById('settings-overlay').classList.remove('show'); }
