/* ============================================================
   APP INITIALIZATION & TAB SWITCHING
   ============================================================ */
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('tab-' + tab).classList.add('active');
  btn.classList.add('active');

  if (tab === 'chart' && !STATE.map) {
    setTimeout(function() { initMap(); updateMap(); }, 100);
  }
  if (tab === 'chart' && STATE.map) {
    setTimeout(function() { STATE.map.invalidateSize(); }, 100);
  }
  if (tab === 'skyplot') {
    setTimeout(drawSkyPlot, 100);
  }
  if (tab === 'celestial') {
    setTimeout(renderCelestial, 100);
  }
}

function handleResize() {
  if (document.getElementById('tab-celestial').classList.contains('active')) {
    renderCelestial();
  }
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

  // Clock updater
  setInterval(updateClock, 1000);
  updateClock();

  // Regular display update
  setInterval(updateDisplay, 1000);

  // Skyplot update every 30s
  setInterval(function() {
    if (document.getElementById('tab-skyplot').classList.contains('active')) drawSkyPlot();
  }, 30000);

  // Celestial update every 60s
  setInterval(function() {
    if (document.getElementById('tab-celestial').classList.contains('active')) renderCelestial();
  }, 60000);

  window.addEventListener('resize', handleResize);

  // Re-acquire wake lock on every visibility change
  document.addEventListener('visibilitychange', handleVisibilityForWakeLock);

  // Also try to start NoSleep on first user interaction (for autoplay policy)
  document.addEventListener('click', function firstInteraction() {
    if (getSettings().wakeLock) {
      startNoSleep();
    }
    document.removeEventListener('click', firstInteraction);
  }, { once: true });
});
