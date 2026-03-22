/* ============================================================
   GLOBAL STATE & SETTINGS
   ============================================================ */
const STATE = {
  lat: null, lon: null, alt: null, accuracy: null,
  speed: null, heading: null, cogGPS: null, sogMS: null,
  compassHeading: null, magVar: null,
  watchId: null, wakeLockSentinel: null,
  map: null, marker: null, trackLine: null, trackPoints: [],
  seamarkLayer: null, peer: null, conn: null,
  isSharing: false, isReceiving: false,
  // GPS freeze state
  gpsLost: false,
  lastKnown: null, // { lat, lon, alt, accuracy, sogMS, cogGPS, compassHeading, magVar, timestamp }
  // Manual position mode
  manualMode: false,
  manualLat: null,
  manualLon: null,
  // Wake lock
  noSleepVideo: null,
  wakeLockActive: false
};

function getSettings() {
  const defaults = {
    nightMode: false, wakeLock: true, posFormat: 'dm',
    accThreshold: '50', seamarks: true, trackTrail: true,
    celestialHdg: '0', heightOfEye: '15'
  };
  try {
    const saved = JSON.parse(localStorage.getItem('navigps_settings') || '{}');
    return { ...defaults, ...saved };
  } catch(e) { return defaults; }
}

function saveSetting(key, value) {
  const s = getSettings();
  s[key] = value;
  localStorage.setItem('navigps_settings', JSON.stringify(s));
}

function toggleSetting(key, el) {
  const s = getSettings();
  const newVal = !s[key];
  saveSetting(key, newVal);
  el.classList.toggle('on', newVal);
  if (key === 'nightMode') applyTheme();
  if (key === 'wakeLock') {
    if (newVal) { requestWakeLock(); } else { releaseAllWakeLocks(); }
  }
}

function applySettings() {
  const s = getSettings();
  document.getElementById('toggleNight').classList.toggle('on', s.nightMode);
  document.getElementById('toggleWake').classList.toggle('on', s.wakeLock);
  document.getElementById('toggleSeamarks').classList.toggle('on', s.seamarks);
  document.getElementById('toggleTrack').classList.toggle('on', s.trackTrail);
  document.getElementById('posFormat').value = s.posFormat;
  document.getElementById('accThreshold').value = s.accThreshold;
  document.getElementById('celestialHdg').value = s.celestialHdg;
  document.getElementById('heightOfEye').value = s.heightOfEye;
  applyTheme();
  if (s.wakeLock) requestWakeLock();
}

function applyTheme() {
  const s = getSettings();
  document.documentElement.setAttribute('data-theme', s.nightMode ? 'night' : 'default');
  document.querySelector('meta[name="theme-color"]').content = s.nightMode ? '#0a0000' : '#0a0e14';
}

function openSettings() { document.getElementById('settings-overlay').classList.add('show'); }
function closeSettings() { document.getElementById('settings-overlay').classList.remove('show'); }
