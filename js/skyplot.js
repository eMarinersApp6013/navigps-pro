/* ============================================================
   SKYPLOT (GNSS visibility + SNR bar chart)
   ============================================================ */
var lastSatData = []; // Store for SNR chart

function drawSkyPlot() {
  var canvas = document.getElementById('skyplot-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  var cx = w/2, cy = h/2, r = w/2 - 30;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim();
  ctx.fillRect(0, 0, w, h);

  var gridColor = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim();
  var textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();

  for (var el = 0; el <= 90; el += 30) {
    var cr = r * (90 - el) / 90;
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.strokeStyle = gridColor; ctx.lineWidth = el === 0 ? 1.5 : 0.5; ctx.stroke();
    if (el > 0 && el < 90) {
      ctx.fillStyle = textColor; ctx.font = '9px JetBrains Mono';
      ctx.fillText(el + '\u00B0', cx + 3, cy - cr + 10);
    }
  }
  for (var az = 0; az < 360; az += 30) {
    var rad = az * Math.PI / 180;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.sin(rad), cy - r * Math.cos(rad));
    ctx.strokeStyle = gridColor; ctx.lineWidth = az % 90 === 0 ? 1 : 0.3; ctx.stroke();
  }
  ctx.fillStyle = '#ff4444'; ctx.font = 'bold 12px JetBrains Mono'; ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - r - 8);
  ctx.fillStyle = textColor; ctx.font = '10px JetBrains Mono';
  ctx.fillText('E', cx + r + 12, cy + 4);
  ctx.fillText('S', cx, cy + r + 15);
  ctx.fillText('W', cx - r - 12, cy + 4);

  if (STATE.lat == null) {
    ctx.fillStyle = textColor; ctx.font = '12px IBM Plex Sans';
    ctx.fillText('Waiting for GPS fix...', cx, cy);
    return;
  }

  var now = new Date();
  var sats = generateSatPositions(STATE.lat, STATE.lon, now);
  lastSatData = [];

  var counts = { GPS: 0, GLONASS: 0, Galileo: 0, BeiDou: 0 };
  var colors = { GPS: '#2a7fff', GLONASS: '#ff4444', Galileo: '#00e676', BeiDou: '#ffab00' };

  sats.forEach(function(sat) {
    if (sat.el < 5) return;
    counts[sat.sys]++;
    // Simulate SNR: higher elevation = stronger signal (20-50 dBHz)
    var snr = Math.round(20 + (sat.el / 90) * 28 + (Math.random() * 4 - 2));
    snr = Math.max(15, Math.min(52, snr));
    sat.snr = snr;
    lastSatData.push(sat);

    var sr = r * (90 - sat.el) / 90;
    var saz = sat.az * Math.PI / 180;
    var sx = cx + sr * Math.sin(saz);
    var sy = cy - sr * Math.cos(saz);
    ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fillStyle = colors[sat.sys] || '#fff'; ctx.fill();
    ctx.font = '8px JetBrains Mono'; ctx.fillStyle = colors[sat.sys];
    ctx.textAlign = 'center'; ctx.fillText(sat.prn, sx, sy - 8);
  });

  document.getElementById('gpsCount').textContent = counts.GPS;
  document.getElementById('gloCount').textContent = counts.GLONASS;
  document.getElementById('galCount').textContent = counts.Galileo;
  document.getElementById('bdsCount').textContent = counts.BeiDou;

  var visibleSats = sats.filter(function(s) { return s.el >= 10; });
  if (visibleSats.length >= 4) {
    var dop = computeDOP(visibleSats);
    document.getElementById('hdopDisplay').textContent = dop.hdop.toFixed(1);
    document.getElementById('vdopDisplay').textContent = dop.vdop.toFixed(1);
    document.getElementById('pdopDisplay').textContent = dop.pdop.toFixed(1);
  }

  // Draw SNR bar chart
  drawSNRChart();
}

/* ============================================================
   SNR BAR CHART
   ============================================================ */
function drawSNRChart() {
  var canvas = document.getElementById('snr-canvas');
  if (!canvas || lastSatData.length === 0) return;
  var ctx = canvas.getContext('2d');

  // Resize to parent width
  var parent = canvas.parentElement;
  canvas.width = parent.clientWidth || 380;
  canvas.height = 140;
  var w = canvas.width, h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim();
  ctx.fillRect(0, 0, w, h);

  var colors = { GPS: '#2a7fff', GLONASS: '#ff4444', Galileo: '#00e676', BeiDou: '#ffab00' };
  var gridColor = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim();
  var textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();

  var margin = { left: 28, right: 4, top: 8, bottom: 20 };
  var chartW = w - margin.left - margin.right;
  var chartH = h - margin.top - margin.bottom;
  var maxSNR = 55;
  var barCount = lastSatData.length;
  var barW = Math.max(4, Math.min(12, (chartW / barCount) - 2));
  var gap = (chartW - barW * barCount) / (barCount + 1);

  // Y-axis grid
  for (var snrLine = 10; snrLine <= 50; snrLine += 10) {
    var ly = margin.top + chartH - (snrLine / maxSNR) * chartH;
    ctx.beginPath(); ctx.moveTo(margin.left, ly); ctx.lineTo(w - margin.right, ly);
    ctx.strokeStyle = gridColor; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.fillStyle = textColor; ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'right';
    ctx.fillText(snrLine, margin.left - 3, ly + 3);
  }

  // Bars
  lastSatData.forEach(function(sat, i) {
    var x = margin.left + gap + i * (barW + gap);
    var barH = (sat.snr / maxSNR) * chartH;
    var y = margin.top + chartH - barH;
    var color = colors[sat.sys] || '#888';

    // Bar fill with gradient
    var grad = ctx.createLinearGradient(0, y, 0, y + barH);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + '66');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barW, barH);

    // SNR value on top
    ctx.fillStyle = color; ctx.font = 'bold 7px JetBrains Mono'; ctx.textAlign = 'center';
    ctx.fillText(sat.snr, x + barW/2, y - 2);

    // PRN label at bottom
    ctx.fillStyle = textColor; ctx.font = '6px JetBrains Mono';
    ctx.save(); ctx.translate(x + barW/2, h - 2);
    ctx.fillText(sat.prn, 0, 0);
    ctx.restore();
  });

  // Y-axis label
  ctx.save(); ctx.translate(8, h/2); ctx.rotate(-Math.PI/2);
  ctx.fillStyle = textColor; ctx.font = '8px IBM Plex Sans'; ctx.textAlign = 'center';
  ctx.fillText('SNR (dBHz)', 0, 0); ctx.restore();
}

function generateSatPositions(lat, lon, time) {
  var sats = [];
  var hr = time.getUTCHours() + time.getUTCMinutes() / 60;

  for (var i = 1; i <= 31; i++) {
    var plane = Math.floor((i - 1) / 5), slot = (i - 1) % 5;
    var raan = (plane * 60 + hr * 15.04) % 360;
    var ma = (slot * 72 + hr * 15.04 + i * 13.7 + lon * 0.5) % 360;
    var el = computeSatElevation(lat, lon, 55, raan, ma);
    var az = computeSatAzimuth(lat, lon, 55, raan, ma);
    if (el > 0) sats.push({ sys: 'GPS', prn: 'G' + i.toString().padStart(2, '0'), el: el, az: az });
  }
  for (var i = 1; i <= 24; i++) {
    var plane = Math.floor((i - 1) / 8), slot = (i - 1) % 8;
    var raan = (plane * 120 + 20 + hr * 15.04) % 360;
    var ma = (slot * 45 + hr * 15.2 + i * 17.3 + lon * 0.5) % 360;
    var el = computeSatElevation(lat, lon, 64.8, raan, ma);
    var az = computeSatAzimuth(lat, lon, 64.8, raan, ma);
    if (el > 0) sats.push({ sys: 'GLONASS', prn: 'R' + i.toString().padStart(2, '0'), el: el, az: az });
  }
  for (var i = 1; i <= 24; i++) {
    var plane = Math.floor((i - 1) / 8), slot = (i - 1) % 8;
    var raan = (plane * 120 + 40 + hr * 14.98) % 360;
    var ma = (slot * 45 + hr * 14.98 + i * 19.1 + lon * 0.5) % 360;
    var el = computeSatElevation(lat, lon, 56, raan, ma);
    var az = computeSatAzimuth(lat, lon, 56, raan, ma);
    if (el > 0) sats.push({ sys: 'Galileo', prn: 'E' + i.toString().padStart(2, '0'), el: el, az: az });
  }
  for (var i = 1; i <= 30; i++) {
    var plane = Math.floor((i - 1) / 10), slot = (i - 1) % 10;
    var raan = (plane * 120 + 80 + hr * 14.96) % 360;
    var ma = (slot * 36 + hr * 14.96 + i * 11.9 + lon * 0.5) % 360;
    var el = computeSatElevation(lat, lon, 55, raan, ma);
    var az = computeSatAzimuth(lat, lon, 55, raan, ma);
    if (el > 0) sats.push({ sys: 'BeiDou', prn: 'C' + i.toString().padStart(2, '0'), el: el, az: az });
  }
  return sats;
}

function computeSatElevation(obsLat, obsLon, incl, raan, ma) {
  var D = Math.PI / 180;
  var subLat = Math.asin(Math.sin(incl * D) * Math.sin(ma * D)) / D;
  var subLon = (raan + Math.atan2(Math.cos(incl * D) * Math.sin(ma * D), Math.cos(ma * D)) / D) % 360;
  var dLon = (obsLon - subLon) * D;
  var centralAngle = Math.acos(Math.sin(obsLat * D) * Math.sin(subLat * D) + Math.cos(obsLat * D) * Math.cos(subLat * D) * Math.cos(dLon));
  return Math.atan2(Math.cos(centralAngle) - 6371 / 26560, Math.sin(centralAngle)) / D;
}

function computeSatAzimuth(obsLat, obsLon, incl, raan, ma) {
  var D = Math.PI / 180;
  var subLat = Math.asin(Math.sin(incl * D) * Math.sin(ma * D)) / D;
  var subLon = (raan + Math.atan2(Math.cos(incl * D) * Math.sin(ma * D), Math.cos(ma * D)) / D) % 360;
  var dLon = (subLon - obsLon) * D;
  return (Math.atan2(Math.sin(dLon), Math.cos(obsLat * D) * Math.tan(subLat * D) - Math.sin(obsLat * D) * Math.cos(dLon)) / D + 360) % 360;
}

function computeDOP(sats) {
  var D = Math.PI / 180, n = sats.length;
  if (n < 4) return { hdop: 99, vdop: 99, pdop: 99 };
  var H = [];
  for (var si = 0; si < n; si++) {
    var s = sats[si], elR = s.el * D, azR = s.az * D;
    H.push([Math.cos(elR) * Math.sin(azR), Math.cos(elR) * Math.cos(azR), Math.sin(elR), 1]);
  }
  var Q = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
  for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) for (var k = 0; k < n; k++) Q[i][j] += H[k][i] * H[k][j];
  try {
    var inv = invertMatrix4(Q);
    return {
      hdop: Math.min(Math.sqrt(Math.max(0, inv[0][0] + inv[1][1])), 99),
      vdop: Math.min(Math.sqrt(Math.max(0, inv[2][2])), 99),
      pdop: Math.min(Math.sqrt(Math.max(0, inv[0][0] + inv[1][1] + inv[2][2])), 99)
    };
  } catch(e) { return { hdop: 99, vdop: 99, pdop: 99 }; }
}

function invertMatrix4(m) {
  var n = 4, a = m.map(function(r) { return r.slice(); }), I = [];
  for (var i = 0; i < n; i++) { I[i] = []; for (var j = 0; j < n; j++) I[i][j] = i === j ? 1 : 0; }
  for (var i = 0; i < n; i++) {
    var maxR = i;
    for (var k = i+1; k < n; k++) if (Math.abs(a[k][i]) > Math.abs(a[maxR][i])) maxR = k;
    var tmp = a[i]; a[i] = a[maxR]; a[maxR] = tmp; tmp = I[i]; I[i] = I[maxR]; I[maxR] = tmp;
    var d = a[i][i]; if (Math.abs(d) < 1e-10) throw 'singular';
    for (var j = 0; j < n; j++) { a[i][j] /= d; I[i][j] /= d; }
    for (var k = 0; k < n; k++) { if (k === i) continue; var f = a[k][i]; for (var j = 0; j < n; j++) { a[k][j] -= f * a[i][j]; I[k][j] -= f * I[i][j]; } }
  }
  return I;
}
