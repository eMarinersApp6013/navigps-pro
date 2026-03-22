/* ============================================================
   COMPASS (DeviceOrientation)
   ============================================================ */
function initCompass() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS - needs user gesture
    document.body.addEventListener('click', function iosCompassInit() {
      DeviceOrientationEvent.requestPermission().then(function(response) {
        if (response === 'granted') {
          window.addEventListener('deviceorientation', onDeviceOrientation);
        }
      }).catch(function(){});
      document.body.removeEventListener('click', iosCompassInit);
    }, { once: true });
  } else if (window.DeviceOrientationEvent) {
    // Try absolute first (Android)
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', onDeviceOrientation);
    } else {
      window.addEventListener('deviceorientation', onDeviceOrientation);
    }
  }
}

function onDeviceOrientation(event) {
  var heading = null;
  if (event.webkitCompassHeading !== undefined) {
    heading = event.webkitCompassHeading; // iOS
  } else if (event.absolute && event.alpha !== null) {
    heading = (360 - event.alpha) % 360; // Android absolute
  } else if (event.alpha !== null) {
    heading = (360 - event.alpha) % 360; // Fallback
  }
  if (heading !== null) {
    STATE.compassHeading = Math.round(heading * 10) / 10;
  }
}

/* ============================================================
   COMPASS TICKS (SVG generation)
   ============================================================ */
function generateCompassTicks() {
  var g = document.getElementById('compassTicks');
  for (var i = 0; i < 360; i += 5) {
    var r1 = i % 30 === 0 ? 82 : (i % 10 === 0 ? 85 : 87);
    var r2 = 90;
    var rad = i * Math.PI / 180;
    var x1 = 100 + r1 * Math.sin(rad);
    var y1 = 100 - r1 * Math.cos(rad);
    var x2 = 100 + r2 * Math.sin(rad);
    var y2 = 100 - r2 * Math.cos(rad);
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', i % 30 === 0 ? 'var(--text-secondary)' : 'var(--text-dim)');
    line.setAttribute('stroke-width', i % 30 === 0 ? '1.5' : '0.5');
    g.appendChild(line);
  }
}
