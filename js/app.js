/* ============================================================
   MANUAL REFRESH BUTTON — works for both GPS and Remote mode
   ============================================================ */
function manualRefresh() {
  var btn = document.getElementById('refreshBtn');
  if (btn) {
    btn.style.transform = 'rotate(360deg)';
    btn.style.transition = 'transform 0.5s';
    setTimeout(function() { btn.style.transform = ''; btn.style.transition = ''; }, 600);
  }

  if (STATE.remoteMode) {
    // In remote mode: reconnect the peer if disconnected
    if (STATE.conn && STATE.conn.open) {
      // Connection still open — just refresh displays
      refreshAllDisplays();
    } else if (STATE.peer && !STATE.peer.destroyed && STATE.remoteCode) {
      // Try reconnecting
      connectToPeer('navigps-' + STATE.remoteCode, STATE.remoteCode);
    }
  } else {
    // GPS mode: force a fresh position request
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(onPosition, function() {}, {
        enableHighAccuracy: true, timeout: 10000, maximumAge: 0
      });
    }
  }
  // Always refresh displays
  refreshAllDisplays();
  if (STATE.map) STATE.map.invalidateSize();
  fetchWeather();
}

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

  // Fix remote mode screen lock: reconnect peer when screen wakes up
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      // Re-request GPS position immediately
      if (!STATE.manualMode && !STATE.remoteMode && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(onPosition, function() {}, {
          enableHighAccuracy: true, timeout: 10000, maximumAge: 0
        });
      }
      // Reconnect remote peer if needed
      if (STATE.remoteMode && STATE.remoteCode) {
        setTimeout(function() {
          if (!STATE.conn || !STATE.conn.open) {
            if (STATE.peer && !STATE.peer.destroyed) {
              connectToPeer('navigps-' + STATE.remoteCode, STATE.remoteCode);
            } else {
              // Peer destroyed — restart receiving
              connectToSender();
            }
          }
        }, 1000);
      }
      // Reconnect sender if sharing
      if (STATE.isSharing && STATE.peer) {
        setTimeout(function() {
          if (STATE.peer.disconnected && !STATE.peer.destroyed) {
            try { STATE.peer.reconnect(); } catch(e) {}
          }
        }, 1000);
      }
    }
  });

  // NoSleep on first user interaction
  document.addEventListener('click', function firstInteraction() {
    if (getSettings().wakeLock) startNoSleep();
    document.removeEventListener('click', firstInteraction);
  }, { once: true });
});
