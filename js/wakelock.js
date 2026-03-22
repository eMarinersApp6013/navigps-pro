/* ============================================================
   WAKE LOCK — Screen Keep-Awake
   Primary: Wake Lock API
   Fallback: NoSleep video trick (invisible looping video)
   ============================================================ */

// Tiny base64-encoded MP4 video (silent, 1-second loop)
// This tricks mobile browsers into thinking media is playing, preventing screen sleep
const NOSLEEP_VIDEO_SRC = 'data:video/mp4;base64,AAAAIGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAABRtb292AAAAbG12aGQAAAAAAAAAAAAAAAAAA+gAAAPoAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAABidWR0YQAAAFptZXRhAAAAIWhkbHIAAAAAAAAAAG1kaXIAAAAAAAAAAAAAAAAAAAAkaWxzdAAAAByhbmFtAAAAFGRhdGEAAAABAAAAAHRlc3QAAABfbWRhdAAAAAAAAD4AAAAyYXZjQwFkAAr/4QAZZGQAK/LYCkGaEAAAAwAEAAADAKA8WLZYAAADAGjr7wPqSy3Aw/8AAAA8AAAAMGFkdHMAAAAoAAAAAgAAABxzdHRzAAAAAAAAAAEAAAABAAAAAgAAAAAUc3RzYwAAAAAAAAABAAAA';

function initNoSleepVideo() {
  if (STATE.noSleepVideo) return;
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  video.setAttribute('title', 'keep-awake');
  video.style.cssText = 'position:fixed;top:-1px;left:-1px;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:-1;';
  video.src = NOSLEEP_VIDEO_SRC;
  video.muted = true;
  document.body.appendChild(video);
  STATE.noSleepVideo = video;
}

function startNoSleep() {
  initNoSleepVideo();
  if (STATE.noSleepVideo) {
    const playPromise = STATE.noSleepVideo.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Autoplay blocked — will retry on next user interaction
      });
    }
  }
}

function stopNoSleep() {
  if (STATE.noSleepVideo) {
    STATE.noSleepVideo.pause();
  }
}

async function requestWakeLock() {
  let apiSuccess = false;

  // Primary: Wake Lock API
  try {
    if ('wakeLock' in navigator) {
      STATE.wakeLockSentinel = await navigator.wakeLock.request('screen');
      apiSuccess = true;
      STATE.wakeLockSentinel.addEventListener('release', () => {
        // Will be re-acquired on visibilitychange
        updateWakeLockIndicator(false);
      });
    }
  } catch(e) { /* Wake Lock API failed */ }

  // Fallback: NoSleep video
  startNoSleep();

  STATE.wakeLockActive = true;
  updateWakeLockIndicator(apiSuccess || (STATE.noSleepVideo && !STATE.noSleepVideo.paused));
}

function releaseAllWakeLocks() {
  if (STATE.wakeLockSentinel) {
    STATE.wakeLockSentinel.release();
    STATE.wakeLockSentinel = null;
  }
  stopNoSleep();
  STATE.wakeLockActive = false;
  updateWakeLockIndicator(false);
}

function updateWakeLockIndicator(active) {
  const icon = document.getElementById('wakelockIcon');
  if (!icon) return;
  const fill = icon.querySelector('.lock-fill');
  if (fill) {
    fill.setAttribute('fill', active ? 'var(--accent)' : 'var(--danger)');
  }
  icon.title = active ? 'Screen keep-awake: ACTIVE' : 'Screen keep-awake: FAILED';
}

// Re-acquire on every visibility change
function handleVisibilityForWakeLock() {
  if (document.visibilityState === 'visible' && getSettings().wakeLock) {
    requestWakeLock();
    // iOS: re-trigger NoSleep video on every focus (iOS pauses video on screen lock)
    startNoSleep();
  }
}

// iOS-specific: also handle pageshow event (fired when coming back from lock screen on iOS Safari)
window.addEventListener('pageshow', function() {
  if (getSettings().wakeLock) {
    requestWakeLock();
    startNoSleep();
  }
});

// iOS: re-trigger on touchstart (first interaction after lock screen)
document.addEventListener('touchstart', function iosWakeLockRetry() {
  if (getSettings().wakeLock && STATE.noSleepVideo && STATE.noSleepVideo.paused) {
    startNoSleep();
  }
}, { passive: true });
