/* ============================================================
   CELESTIAL — True 3D Hemisphere / Dome Sky View
   Stereographic projection, magnitude-based star sizes,
   twilight sky colors, altitude grid circles
   ============================================================ */
var celestialBodies = [];
var celestialMode = 'stars'; // 'stars' or 'sun'

function setCelestialMode(mode) {
  celestialMode = mode;
  document.getElementById('btnModeStars').classList.toggle('active', mode === 'stars');
  document.getElementById('btnModeSun').classList.toggle('active', mode === 'sun');
  document.getElementById('sunDetailsPanel').style.display = mode === 'sun' ? 'block' : 'none';
  renderCelestial();
  if (mode === 'sun') updateSunDetails();
}

var NAV_STARS = [
  ['Polaris',37.95,89.26,1.98,'Ursa Minor','\u03B1 UMi'],
  ['Alpheratz',353.15,29.09,2.06,'Andromeda','\u03B1 And'],
  ['Ankaa',353.17,-42.31,2.40,'Phoenix','\u03B1 Phe'],
  ['Schedar',349.87,56.54,2.24,'Cassiopeia','\u03B1 Cas'],
  ['Diphda',348.98,-17.98,2.04,'Cetus','\u03B2 Cet'],
  ['Achernar',335.26,-57.24,0.46,'Eridanus','\u03B1 Eri'],
  ['Hamal',327.99,23.46,2.00,'Aries','\u03B1 Ari'],
  ['Menkar',314.13,4.09,2.53,'Cetus','\u03B1 Cet'],
  ['Mirfak',308.59,49.86,1.79,'Perseus','\u03B1 Per'],
  ['Aldebaran',290.97,16.51,0.85,'Taurus','\u03B1 Tau'],
  ['Rigel',281.28,-8.20,0.13,'Orion','\u03B2 Ori'],
  ['Capella',280.73,46.00,0.08,'Auriga','\u03B1 Aur'],
  ['Bellatrix',278.43,6.35,1.64,'Orion','\u03B3 Ori'],
  ['Elnath',278.11,28.61,1.65,'Taurus','\u03B2 Tau'],
  ['Alnilam',275.86,-1.20,1.69,'Orion','\u03B5 Ori'],
  ['Betelgeuse',270.97,7.41,0.50,'Orion','\u03B1 Ori'],
  ['Canopus',263.99,-52.70,-0.74,'Carina','\u03B1 Car'],
  ['Sirius',258.66,-16.72,-1.46,'Canis Major','\u03B1 CMa'],
  ['Procyon',244.99,5.23,0.34,'Canis Minor','\u03B1 CMi'],
  ['Pollux',243.53,28.01,1.14,'Gemini','\u03B2 Gem'],
  ['Regulus',207.37,11.97,1.40,'Leo','\u03B1 Leo'],
  ['Dubhe',193.51,61.75,1.79,'Ursa Major','\u03B1 UMa'],
  ['Denebola',182.53,14.57,2.14,'Leo','\u03B2 Leo'],
  ['Acrux',173.07,-63.10,0.76,'Crux','\u03B1 Cru'],
  ['Gacrux',171.95,-57.11,1.63,'Crux','\u03B3 Cru'],
  ['Alioth',166.20,55.96,1.77,'Ursa Major','\u03B5 UMa'],
  ['Spica',158.33,-11.16,1.04,'Virgo','\u03B1 Vir'],
  ['Alkaid',152.91,49.31,1.86,'Ursa Major','\u03B7 UMa'],
  ['Hadar',148.79,-60.37,0.61,'Centaurus','\u03B2 Cen'],
  ['Arcturus',145.97,19.18,-0.05,'Bootes','\u03B1 Boo'],
  ['Rigil Kent',139.90,-60.84,-0.01,'Centaurus','\u03B1 Cen'],
  ['Kochab',137.18,74.15,2.08,'Ursa Minor','\u03B2 UMi'],
  ['Antares',112.42,-26.43,1.09,'Scorpius','\u03B1 Sco'],
  ['Vega',80.74,38.78,0.03,'Lyra','\u03B1 Lyr'],
  ['Altair',62.07,8.87,0.77,'Aquila','\u03B1 Aql'],
  ['Deneb',49.31,45.28,1.25,'Cygnus','\u03B1 Cyg'],
  ['Fomalhaut',15.42,-29.63,1.16,'Piscis Austrinus','\u03B1 PsA'],
];

var CONSTELLATION_EXTRA_STARS = [
  ['Mintaka',278.82,-0.30],['Saiph',283.70,-9.67],['Merak',194.07,56.38],
  ['Phecda',193.90,53.69],['Megrez',183.86,57.03],['Mizar',167.00,54.93],
  ['Castor',246.24,31.89],['Alhena',245.98,16.40],
  ['Alderamin',40.07,62.59],['Caph',352.49,59.15],['Navi',0.68,60.72],
  ['Ruchbah',6.55,60.24],['Shedir',349.87,56.54],
  ['Mimosa',172.10,-59.69],['Delta Cru',174.13,-58.75],
  ['Shaula',96.37,-37.10],['Sargas',104.06,-42.99],
  ['Dschubba',120.18,-22.62],['Graffias',119.21,-19.81],
  ['Rasalhague',96.57,12.56],['Sadr',56.73,40.26],
  ['Gienah',50.13,33.97],['Albireo',54.01,27.96],
  ['Tarazed',60.14,10.61],['Alschain',62.65,6.41],
  ['Sheliak',81.18,33.36],['Sulafat',81.98,32.69],
  ['Nunki',82.90,-26.30],['Kaus Australis',83.80,-34.38],
  ['Ascella',89.36,-29.88],['Nair Al Saif',283.63,-5.91],
];

var CONSTELLATION_LINES = [
  ['Betelgeuse','Bellatrix'],['Betelgeuse','Alnilam'],['Bellatrix','Alnilam'],
  ['Alnilam','Mintaka'],['Alnilam','Nair Al Saif'],
  ['Betelgeuse','Saiph'],['Bellatrix','Rigel'],['Rigel','Saiph'],
  ['Dubhe','Merak'],['Dubhe','Megrez'],['Merak','Phecda'],
  ['Phecda','Megrez'],['Megrez','Alioth'],['Alioth','Mizar'],['Mizar','Alkaid'],
  ['Schedar','Caph'],['Schedar','Navi'],['Navi','Ruchbah'],['Ruchbah','Caph'],
  ['Acrux','Gacrux'],['Mimosa','Delta Cru'],
  ['Pollux','Castor'],['Pollux','Alhena'],
  ['Antares','Dschubba'],['Antares','Shaula'],['Shaula','Sargas'],
  ['Regulus','Denebola'],
  ['Deneb','Sadr'],['Sadr','Gienah'],['Sadr','Albireo'],
  ['Altair','Tarazed'],['Altair','Alschain'],
  ['Vega','Sheliak'],['Vega','Sulafat'],['Sheliak','Sulafat'],
  ['Vega','Deneb'],['Vega','Altair'],['Deneb','Altair'],
];

function calcStarAzAlt(ra, dec, lat, lon, siderealTime) {
  var ha = (siderealTime * 15 + lon - ra + 360) % 360;
  var haR = ha * Math.PI / 180, decR = dec * Math.PI / 180, latR = lat * Math.PI / 180;
  var sinAlt = Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(haR);
  var alt = Math.asin(sinAlt) * 180 / Math.PI;
  var cosAz = (Math.sin(decR) - Math.sin(latR) * sinAlt) / (Math.cos(latR) * Math.cos(Math.asin(sinAlt)));
  var az = Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180 / Math.PI;
  if (Math.sin(haR) > 0) az = 360 - az;
  return { az: az, alt: alt };
}

/* Stereographic dome projection: az/alt → x,y on canvas */
function domeProject(az, alt, shipHdg, cx, cy, radius) {
  if (alt < 0) return null;
  var relAz = ((az - shipHdg + 360) % 360) * Math.PI / 180;
  // Stereographic: r = cos(alt) / (1 + sin(alt)) — maps zenith to center
  var r = radius * Math.cos(alt * Math.PI / 180) / (1 + Math.sin(alt * Math.PI / 180));
  // 0° is top (head), 90° is right (stbd), etc.
  var x = cx + r * Math.sin(relAz);
  var y = cy - r * Math.cos(relAz);
  return { x: x, y: y };
}

/* Magnitude to pixel radius */
function magToSize(mag) {
  return Math.max(1, 4 - mag * 0.8);
}

/* Get sky background color based on sun altitude */
function getSkyColor(sunAlt, nightMode) {
  if (nightMode) return '#0a0000';
  if (sunAlt > 0) return '#1a3050';      // Day — deep blue
  if (sunAlt > -6) return '#2a1830';      // Civil twilight — purple/orange
  if (sunAlt > -12) return '#0a1228';     // Nautical twilight — deep blue
  if (sunAlt > -18) return '#060a18';     // Astronomical twilight
  return '#030510';                        // Night — near black
}

function renderCelestial() {
  var canvas = document.getElementById('celestial-canvas');
  if (!canvas) return;

  var parent = canvas.parentElement;
  // Fix black page: ensure canvas has valid dimensions
  var pw = parent.clientWidth || window.innerWidth - 16;
  var ph = parent.clientHeight || 400;
  if (pw < 100) pw = window.innerWidth - 16;
  if (ph < 100) ph = 400;
  canvas.width = pw;
  canvas.height = ph;

  // Update sun details if in sun mode
  if (celestialMode === 'sun') updateSunDetails();

  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  var cx = w / 2, cy = h / 2;
  var radius = Math.min(cx, cy) - 30;

  ctx.clearRect(0, 0, w, h);

  var shipHdg = parseFloat(document.getElementById('celestialHdg').value) || 0;
  var hoe = parseFloat(document.getElementById('heightOfEye').value) || 15;
  var lat = STATE.manualMode && STATE.manualLat != null ? STATE.manualLat : (STATE.lat || 25.0);
  var lon = STATE.manualMode && STATE.manualLon != null ? STATE.manualLon : (STATE.lon || 55.0);
  var now = new Date();
  var nightMode = getSettings().nightMode;

  if (typeof Astronomy === 'undefined') {
    ctx.fillStyle = nightMode ? '#080000' : '#030510';
    ctx.fillRect(0, 0, w, h);
    ctx.font = '14px IBM Plex Sans'; ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4444';
    ctx.fillText('Astronomy library not loaded', cx, cy);
    return;
  }

  var observer = new Astronomy.Observer(lat, lon, hoe);
  var date = Astronomy.MakeTime(now);
  var siderealTime = Astronomy.SiderealTime(date);

  // Get sun altitude for sky color
  var sunHor = Astronomy.Horizon(date, observer, 'Sun', 'normal');
  var sunAlt = sunHor.altitude;
  var skyColor = getSkyColor(sunAlt, nightMode);

  // Background
  ctx.fillStyle = nightMode ? '#080000' : '#030510';
  ctx.fillRect(0, 0, w, h);

  // Sky dome circle with gradient
  var skyGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  skyGrad.addColorStop(0, skyColor);
  skyGrad.addColorStop(1, nightMode ? '#0a0000' : '#0a1228');
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = skyGrad; ctx.fill();

  // Horizon ring
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = nightMode ? '#440000' : '#ffab00'; ctx.lineWidth = 2; ctx.stroke();

  // Altitude grid circles (10°, 20°, ... 80°)
  var gridColor = nightMode ? '#220000' : '#1a2a40';
  for (var altG = 10; altG <= 80; altG += 10) {
    var gr = radius * Math.cos(altG * Math.PI / 180) / (1 + Math.sin(altG * Math.PI / 180));
    ctx.beginPath(); ctx.arc(cx, cy, gr, 0, Math.PI * 2);
    ctx.strokeStyle = gridColor; ctx.lineWidth = altG % 30 === 0 ? 0.8 : 0.3; ctx.stroke();
    if (altG % 30 === 0) {
      ctx.fillStyle = nightMode ? '#441111' : '#3a5070';
      ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText(altG + '\u00B0', cx + gr + 12, cy);
    }
  }

  // Bearing labels around horizon
  var bearingLabels = { 0: 'HEAD', 45: '045', 90: 'STBD', 135: '135', 180: 'STERN', 225: '225', 270: 'PORT', 315: '315' };
  ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center';
  Object.keys(bearingLabels).forEach(function(deg) {
    var rad = parseInt(deg) * Math.PI / 180;
    var lx = cx + (radius + 16) * Math.sin(rad);
    var ly = cy - (radius + 16) * Math.cos(rad);
    ctx.fillStyle = deg === '0' ? (nightMode ? '#ff2222' : '#00e676') : (nightMode ? '#551111' : '#5a7a9a');
    ctx.fillText(bearingLabels[deg], lx, ly + 3);
  });

  // Twilight status indicator
  var twilightText = '';
  if (sunAlt > 0) twilightText = 'DAY \u2014 Stars not visible';
  else if (sunAlt > -6) twilightText = 'CIVIL TWILIGHT';
  else if (sunAlt > -12) twilightText = 'NAUTICAL TWILIGHT \u2014 Best for star sights';
  else if (sunAlt > -18) twilightText = 'ASTRONOMICAL TWILIGHT';
  else twilightText = 'NIGHT';

  ctx.font = '10px IBM Plex Sans'; ctx.textAlign = 'center';
  ctx.fillStyle = sunAlt > -6 && sunAlt <= 0 ? '#ff8844' : (sunAlt > -12 && sunAlt <= -6 ? '#44aaff' : (nightMode ? '#551111' : '#4a6a8a'));
  ctx.fillText(twilightText, cx, h - 8);
  if (sunAlt > -12 && sunAlt <= -6) {
    ctx.fillStyle = '#44aaff44';
    ctx.fillRect(cx - 120, h - 20, 240, 16);
  }

  // Build star lookup
  var allStars = {};
  NAV_STARS.forEach(function(s) {
    try {
      var pos = calcStarAzAlt(s[1], s[2], lat, lon, siderealTime);
      allStars[s[0]] = { ra: s[1], dec: s[2], az: pos.az, alt: pos.alt, mag: s[3] };
    } catch(e) {}
  });
  CONSTELLATION_EXTRA_STARS.forEach(function(s) {
    try {
      var pos = calcStarAzAlt(s[1], s[2], lat, lon, siderealTime);
      allStars[s[0]] = { ra: s[1], dec: s[2], az: pos.az, alt: pos.alt };
    } catch(e) {}
  });

  // Draw constellation lines
  ctx.strokeStyle = nightMode ? '#331111' : '#1a2540';
  ctx.lineWidth = 0.6; ctx.setLineDash([3, 3]);
  CONSTELLATION_LINES.forEach(function(pair) {
    var s1 = allStars[pair[0]], s2 = allStars[pair[1]];
    if (!s1 || !s2 || (s1.alt < 0 && s2.alt < 0)) return;
    var p1 = domeProject(s1.az, Math.max(0, s1.alt), shipHdg, cx, cy, radius);
    var p2 = domeProject(s2.az, Math.max(0, s2.alt), shipHdg, cx, cy, radius);
    if (!p1 || !p2) return;
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  });
  ctx.setLineDash([]);

  celestialBodies = [];
  var typeColors = {
    sun: nightMode ? '#ff6600' : '#ffd54f',
    moon: nightMode ? '#ff4444' : '#e0e0e0',
    planet: nightMode ? '#ff4422' : '#ff8a65',
    star: nightMode ? '#ff6644' : '#ffe082'
  };
  var planetColors = { Venus: '#ffffff', Mars: '#ff4422', Jupiter: '#ffe0a0', Saturn: '#ffcc44', Mercury: '#ccbbaa' };
  var listHtml = [];

  // Plot solar system bodies
  var solarBodies = [
    { name: 'Sun', body: 'Sun', type: 'sun' },
    { name: 'Moon', body: 'Moon', type: 'moon' },
    { name: 'Venus', body: 'Venus', type: 'planet' },
    { name: 'Mars', body: 'Mars', type: 'planet' },
    { name: 'Jupiter', body: 'Jupiter', type: 'planet' },
    { name: 'Saturn', body: 'Saturn', type: 'planet' },
    { name: 'Mercury', body: 'Mercury', type: 'planet' },
  ];

  solarBodies.forEach(function(b) {
    try {
      var hor = Astronomy.Horizon(date, observer, b.body, 'normal');
      var alt = hor.altitude, az = hor.azimuth;
      if (alt < 0) return;
      var p = domeProject(az, alt, shipHdg, cx, cy, radius);
      if (!p) return;

      if (b.type === 'sun') {
        // Sun glow
        var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 25);
        glow.addColorStop(0, typeColors.sun + 'aa'); glow.addColorStop(1, typeColors.sun + '00');
        ctx.beginPath(); ctx.arc(p.x, p.y, 25, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fillStyle = typeColors.sun; ctx.fill();
      } else if (b.type === 'moon') {
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = typeColors.moon; ctx.fill();
        ctx.strokeStyle = typeColors.moon + '88'; ctx.lineWidth = 1; ctx.stroke();
      } else {
        // Planets — distinct colored circles
        var pColor = planetColors[b.name] || typeColors.planet;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = pColor; ctx.fill();
        ctx.strokeStyle = pColor + '88'; ctx.lineWidth = 1; ctx.stroke();
      }

      ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillStyle = typeColors[b.type]; ctx.fillText(b.name, p.x, p.y - 10);

      celestialBodies.push({ name: b.name, type: b.type, az: az, alt: alt, x: p.x, y: p.y, r: 10, constellation: '--', bayer: '--', magnitude: '--', extra: b.type === 'planet' ? 'Planet' : b.type === 'sun' ? 'Star (our Sun)' : 'Natural Satellite' });

      var relBrg = ((az - shipHdg + 360) % 360);
      var side = relBrg <= 180 ? (relBrg < 10 ? 'AHEAD' : 'STBD') : (relBrg > 350 ? 'AHEAD' : 'PORT');
      listHtml.push('<span style="color:' + typeColors[b.type] + '">\u25CF ' + b.name + '</span> Alt:' + alt.toFixed(1) + '\u00B0 Brg:' + az.toFixed(1) + '\u00B0T ' + side);
    } catch(e) {}
  });

  // Plot navigational stars — size based on magnitude
  NAV_STARS.forEach(function(star) {
    var name = star[0], ra = star[1], dec = star[2], mag = star[3], constellation = star[4], bayer = star[5];
    try {
      var pos = calcStarAzAlt(ra, dec, lat, lon, siderealTime);
      if (pos.alt < 0) return;
      var p = domeProject(pos.az, pos.alt, shipHdg, cx, cy, radius);
      if (!p) return;

      var starSize = magToSize(mag);
      ctx.beginPath(); ctx.arc(p.x, p.y, starSize, 0, Math.PI * 2);
      ctx.fillStyle = typeColors.star; ctx.fill();

      // Label only bright stars
      if (mag < 1.5) {
        ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'center';
        ctx.fillStyle = typeColors.star; ctx.fillText(name, p.x, p.y - starSize - 4);
      }

      celestialBodies.push({ name: name, type: 'star', az: pos.az, alt: pos.alt, x: p.x, y: p.y, r: Math.max(8, starSize + 4), constellation: constellation, bayer: bayer, magnitude: mag, ra: ra, dec: dec });

      if (pos.alt > 5) {
        var relBrg = ((pos.az - shipHdg + 360) % 360);
        var side = relBrg <= 180 ? (relBrg < 10 ? 'AHEAD' : 'STBD') : (relBrg > 350 ? 'AHEAD' : 'PORT');
        listHtml.push('<span style="color:' + typeColors.star + '">\u2605 ' + name + '</span> Alt:' + pos.alt.toFixed(1) + '\u00B0 Brg:' + pos.az.toFixed(1) + '\u00B0T ' + side);
      }
    } catch(e) {}
  });

  // Extra constellation stars (tiny dots)
  CONSTELLATION_EXTRA_STARS.forEach(function(star) {
    try {
      var pos = calcStarAzAlt(star[1], star[2], lat, lon, siderealTime);
      if (pos.alt < 0) return;
      var p = domeProject(pos.az, pos.alt, shipHdg, cx, cy, radius);
      if (!p) return;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
      ctx.fillStyle = typeColors.star + '88'; ctx.fill();
    } catch(e) {}
  });

  document.getElementById('celestialList').innerHTML = listHtml.join('<br>');
}

function initCelestialClick() {
  var canvas = document.getElementById('celestial-canvas');
  if (!canvas) return;
  canvas.addEventListener('click', function(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    var my = (e.clientY - rect.top) * (canvas.height / rect.height);
    var closest = null, minDist = Infinity;
    celestialBodies.forEach(function(body) {
      var dx = mx - body.x, dy = my - body.y;
      var dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < body.r + 10 && dist < minDist) { minDist = dist; closest = body; }
    });
    if (closest) showStarPopup(closest, e.clientX, e.clientY);
    else closeStarPopup();
  });
}

function showStarPopup(body, clickX, clickY) {
  var popup = document.getElementById('starDetailPopup');
  var title = document.getElementById('starPopupTitle');
  var content = document.getElementById('starPopupContent');
  var typeLabel = body.type === 'star' ? '\u2605 Star' : body.type === 'planet' ? '\u25CF Planet' : body.type === 'sun' ? '\u2600 Sun' : '\u263D Moon';
  var typeColor = body.type === 'star' ? 'var(--star-color)' : body.type === 'planet' ? 'var(--planet-color)' : body.type === 'sun' ? 'var(--sun-color)' : 'var(--moon-color)';
  title.textContent = body.name; title.style.color = typeColor;

  var rows = '<div class="popup-row"><span class="popup-label">Type</span><span class="popup-value">' + typeLabel + '</span></div>' +
    '<div class="popup-row"><span class="popup-label">Altitude</span><span class="popup-value">' + body.alt.toFixed(2) + '\u00B0</span></div>' +
    '<div class="popup-row"><span class="popup-label">Azimuth (True)</span><span class="popup-value">' + body.az.toFixed(2) + '\u00B0</span></div>';

  if (body.type === 'star') {
    rows += '<div class="popup-row"><span class="popup-label">Constellation</span><span class="popup-value">' + body.constellation + '</span></div>' +
      '<div class="popup-row"><span class="popup-label">Designation</span><span class="popup-value">' + body.bayer + '</span></div>' +
      '<div class="popup-row"><span class="popup-label">Magnitude</span><span class="popup-value">' + (typeof body.magnitude === 'number' ? body.magnitude.toFixed(2) : body.magnitude) + '</span></div>';
    if (body.ra !== undefined) {
      var raH = Math.floor(body.ra / 15), raM = ((body.ra / 15 - raH) * 60).toFixed(1);
      rows += '<div class="popup-row"><span class="popup-label">RA (SHA)</span><span class="popup-value">' + body.ra.toFixed(1) + '\u00B0 (' + raH + 'h ' + raM + 'm)</span></div>';
      rows += '<div class="popup-row"><span class="popup-label">Declination</span><span class="popup-value">' + (body.dec >= 0 ? '+' : '') + body.dec.toFixed(2) + '\u00B0</span></div>';
    }
    if (body.alt > 10 && body.alt < 70) {
      rows += '<div class="popup-row" style="border:none;color:var(--accent);font-weight:600"><span>Good for celestial navigation</span></div>';
    }
  } else if (body.extra) {
    rows += '<div class="popup-row"><span class="popup-label">Category</span><span class="popup-value">' + body.extra + '</span></div>';
  }
  content.innerHTML = rows;
  popup.style.display = 'block';
  var pw = popup.offsetWidth, ph = popup.offsetHeight;
  var px = clickX + 10, py = clickY - ph / 2;
  if (px + pw > window.innerWidth - 10) px = clickX - pw - 10;
  if (py < 10) py = 10;
  if (py + ph > window.innerHeight - 10) py = window.innerHeight - ph - 10;
  popup.style.left = px + 'px'; popup.style.top = py + 'px';
}

function closeStarPopup() { document.getElementById('starDetailPopup').style.display = 'none'; }

function useLiveHeading() {
  var hdg = STATE.compassHeading || STATE.cogGPS;
  if (hdg != null) {
    document.getElementById('celestialHdg').value = Math.round(hdg);
    saveSetting('celestialHdg', Math.round(hdg).toString());
    renderCelestial();
  }
}

/* ============================================================
   SUN DETAILS (Sunrise, Sunset, LAN, Declination, GHA, EOT)
   ============================================================ */
function updateSunDetails() {
  try {
    var lat = STATE.manualMode && STATE.manualLat != null ? STATE.manualLat : (STATE.lat || 25.0);
    var lon = STATE.manualMode && STATE.manualLon != null ? STATE.manualLon : (STATE.lon || 55.0);
    var hoe = parseFloat(document.getElementById('heightOfEye').value) || 15;
    var observer = new Astronomy.Observer(lat, lon, hoe);
    var now = new Date();
    var date = Astronomy.MakeTime(now);

    // Current Sun position
    var sunHor = Astronomy.Horizon(date, observer, 'Sun', 'normal');
    document.getElementById('sunAlt').textContent = sunHor.altitude.toFixed(2) + '\u00B0';
    document.getElementById('sunAz').textContent = sunHor.azimuth.toFixed(2) + '\u00B0';

    // Sun declination & GHA
    var sunEq = Astronomy.Equator('Sun', date, observer, true, true);
    var dec = sunEq.dec;
    document.getElementById('sunDec').textContent = (dec >= 0 ? '+' : '') + dec.toFixed(2) + '\u00B0';

    // GHA = sidereal time * 15 - RA * 15 (approx)
    var siderealTime = Astronomy.SiderealTime(date);
    var gha = (siderealTime * 15 - sunEq.ra * 15 + 360) % 360;
    var ghaD = Math.floor(gha);
    var ghaM = ((gha - ghaD) * 60).toFixed(1);
    document.getElementById('sunGHA').textContent = ghaD + '\u00B0 ' + ghaM + "'";

    // Equation of Time (approximate)
    // EOT = apparent solar time - mean solar time
    var dayOfYear = Math.floor((now - new Date(now.getFullYear(),0,0)) / 86400000);
    var B = (360/365) * (dayOfYear - 81) * Math.PI / 180;
    var eot = 9.87 * Math.sin(2*B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    var eotMin = Math.floor(Math.abs(eot));
    var eotSec = Math.round((Math.abs(eot) - eotMin) * 60);
    document.getElementById('sunEOT').textContent = (eot >= 0 ? '+' : '-') + eotMin + 'm ' + eotSec + 's';

    // Sunrise/Sunset
    try {
      var rise = Astronomy.SearchRiseSet('Sun', observer, +1, date, 1);
      if (rise) {
        var rDate = rise.date;
        document.getElementById('sunRise').textContent =
          rDate.getUTCHours().toString().padStart(2,'0') + ':' +
          rDate.getUTCMinutes().toString().padStart(2,'0') + ' UTC';
      }
    } catch(e) { document.getElementById('sunRise').textContent = 'N/A'; }

    try {
      var set = Astronomy.SearchRiseSet('Sun', observer, -1, date, 1);
      if (set) {
        var sDate = set.date;
        document.getElementById('sunSet').textContent =
          sDate.getUTCHours().toString().padStart(2,'0') + ':' +
          sDate.getUTCMinutes().toString().padStart(2,'0') + ' UTC';
      }
    } catch(e) { document.getElementById('sunSet').textContent = 'N/A'; }

    // Meridian passage (LAN) = 12:00 - EOT - longitude/15 hours offset
    var lanHours = 12 - (eot / 60) - (lon / 15);
    lanHours = ((lanHours % 24) + 24) % 24;
    var lanH = Math.floor(lanHours);
    var lanM = Math.round((lanHours - lanH) * 60);
    document.getElementById('sunMeridian').textContent = lanH.toString().padStart(2,'0') + ':' + lanM.toString().padStart(2,'0') + ' UTC';

    // Twilight times (civil -6°, nautical -12°)
    try {
      var civilDawn = Astronomy.SearchAltitude('Sun', observer, +1, date, 1, -6);
      var civilDusk = Astronomy.SearchAltitude('Sun', observer, -1, date, 1, -6);
      if (civilDawn && civilDusk) {
        document.getElementById('sunTwilightCivil').textContent =
          civilDawn.date.getUTCHours().toString().padStart(2,'0') + ':' + civilDawn.date.getUTCMinutes().toString().padStart(2,'0') +
          ' / ' +
          civilDusk.date.getUTCHours().toString().padStart(2,'0') + ':' + civilDusk.date.getUTCMinutes().toString().padStart(2,'0') + ' UTC';
      }
    } catch(e) { document.getElementById('sunTwilightCivil').textContent = 'N/A'; }

    try {
      var nautDawn = Astronomy.SearchAltitude('Sun', observer, +1, date, 1, -12);
      var nautDusk = Astronomy.SearchAltitude('Sun', observer, -1, date, 1, -12);
      if (nautDawn && nautDusk) {
        document.getElementById('sunTwilightNaut').textContent =
          nautDawn.date.getUTCHours().toString().padStart(2,'0') + ':' + nautDawn.date.getUTCMinutes().toString().padStart(2,'0') +
          ' / ' +
          nautDusk.date.getUTCHours().toString().padStart(2,'0') + ':' + nautDusk.date.getUTCMinutes().toString().padStart(2,'0') + ' UTC';
      }
    } catch(e) { document.getElementById('sunTwilightNaut').textContent = 'N/A'; }

  } catch(e) {
    console.log('Sun details error:', e);
  }
}
