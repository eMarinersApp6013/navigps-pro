/* ============================================================
   APP INITIALIZATION & TAB SWITCHING
   ============================================================ */
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('tab-' + tab).classList.add('active');
  btn.classList.add('active');

  if (tab === 'chart' && !STATE.map) {
    setTimeout(function() {
      initMap();
      updateMap();
      // Add MOB marker if restored
      if (STATE.mobPosition) addMOBMarker();
    }, 100);
  }
  if (tab === 'chart' && STATE.map) {
    setTimeout(function() { STATE.map.invalidateSize(); }, 100);
  }
  if (tab === 'skyplot') setTimeout(drawSkyPlot, 100);
  if (tab === 'celestial') setTimeout(function() {
    renderCelestial();
    if (celestialMode === 'sun') updateSunDetails();
  }, 150);
  if (tab === 'chart') fetchWeather();
}

function handleResize() {
  if (document.getElementById('tab-celestial').classList.contains('active')) renderCelestial();
  if (document.getElementById('tab-skyplot').classList.contains('active')) drawSkyPlot();
}

/* ============================================================
   INIT
   ============================================================ */
window.addEventListener('load', function() {
  generateCompassTicks();
  applySettings();
  startGeolocation();
  initCompass();
  initCelestialClick();

  // Clock updater (clock only, not display — display is event-driven now)
  setInterval(updateClock, 1000);
  updateClock();

  // GPS age counter is started inside startGeolocation()
  // Display updates are event-driven from onPosition / onRemotePositionData

  // Skyplot refresh every 30s if visible
  setInterval(function() {
    if (document.getElementById('tab-skyplot').classList.contains('active')) drawSkyPlot();
  }, 30000);

  // Celestial refresh every 60s if visible
  setInterval(function() {
    if (document.getElementById('tab-celestial').classList.contains('active')) renderCelestial();
  }, 60000);

  // Weather refresh every 30min
  setInterval(function() {
    if (STATE.lat != null) fetchWeather();
  }, 1800000);

  window.addEventListener('resize', handleResize);
  document.addEventListener('visibilitychange', handleVisibilityForWakeLock);

  // NoSleep on first user interaction
  document.addEventListener('click', function firstInteraction() {
    if (getSettings().wakeLock) startNoSleep();
    document.removeEventListener('click', firstInteraction);
  }, { once: true });
});
