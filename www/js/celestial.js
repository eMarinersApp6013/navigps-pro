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

/* Get horizon coords (azimuth/altitude) for a solar system body.
   This version of astronomy-engine requires Equator() first, then Horizon(). */
function getBodyHorizon(date, observer, bodyName) {
  var eq = Astronomy.Equator(bodyName, date, observer, true, true);
  var hor = Astronomy.Horizon(date, observer, eq.ra, eq.dec, 'normal');
  return { azimuth: hor.azimuth, altitude: hor.altitude, ra: eq.ra, dec: eq.dec };
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

  var wrap = document.getElementById('celestialCanvasWrap');
  var tabEl = document.getElementById('tab-celestial');

  // Robust dimension calculation — use multiple fallbacks
  var pw = 0;
  if (wrap && wrap.offsetWidth > 0) pw = wrap.offsetWidth;
  else if (tabEl && tabEl.offsetWidth > 0) pw = tabEl.offsetWidth - 16;
  else if (canvas.parentElement && canvas.parentElement.offsetWidth > 0) pw = canvas.parentElement.offsetWidth;
  if (pw < 100) pw = window.innerWidth - 16;
  if (pw < 100) pw = 360; // absolute minimum

  // Height: use available space minus controls above
  var tabH = 0;
  if (tabEl && tabEl.offsetHeight > 0) tabH = tabEl.offsetHeight;
  else tabH = window.innerHeight - 120;
  // Account for controls above canvas (STARS/SUN toggle + heading inputs ~120px, sun panel if shown, cards below)
  var controlsH = 120;
  if (celestialMode === 'sun') controlsH += 280; // sun details panel
  var ph = Math.max(300, Math.min(tabH - controlsH - 80, pw)); // keep roughly square-ish, cap to width
  if (ph < 300) ph = 300;

  // Set canvas dimensions (both rendering and CSS)
  canvas.width = pw;
  canvas.height = ph;
  canvas.style.width = pw + 'px';
  canvas.style.height = ph + 'px';
  if (wrap) { wrap.style.height = ph + 'px'; wrap.style.width = pw + 'px'; }

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
  var sunHor = getBodyHorizon(date, observer, 'Sun');
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
      var hor = getBodyHorizon(date, observer, b.body);
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

  // Sort all visible bodies alphabetically by name
  var allVisible = [];
  celestialBodies.forEach(function(b) {
    if (b.alt > 5) {
      var relBrg = ((b.az - shipHdg + 360) % 360);
      var side = relBrg <= 180 ? (relBrg < 10 ? 'AHEAD' : 'STBD') : (relBrg > 350 ? 'AHEAD' : 'PORT');
      var color = typeColors[b.type] || typeColors.star;
      var symbol = b.type === 'star' ? '\u2605' : '\u25CF';
      var mag = typeof b.magnitude === 'number' ? b.magnitude : 2;
      allVisible.push({
        name: b.name, type: b.type, alt: b.alt, az: b.az, side: side, color: color, symbol: symbol, magnitude: mag
      });
    }
  });

  allVisible.sort(function(a, b) { return a.name.localeCompare(b.name); });

  var sortedHtml = allVisible.map(function(v) {
    return '<span style="color:' + v.color + '">' + v.symbol + ' ' + v.name + '</span> Alt:' + v.alt.toFixed(1) + '\u00B0 Brg:' + v.az.toFixed(1) + '\u00B0T ' + v.side;
  });

  // Top 5 by visibility: sort by (altitude * (6 - magnitude)) descending
  var top5 = allVisible.slice().sort(function(a, b) {
    return (b.alt * (6 - b.magnitude)) - (a.alt * (6 - a.magnitude));
  }).slice(0, 5);

  var top5Html = '';
  if (top5.length > 0) {
    top5Html = '<hr style="border-color:#555;margin:6px 0">' +
      '<div style="font-weight:600;color:#ffd54f;font-size:10px;letter-spacing:1px;margin-bottom:4px">TOP 5 BY VISIBILITY</div>';
    top5Html += top5.map(function(v) {
      return '<span style="color:#ffd54f;font-weight:600">' + v.symbol + ' ' + v.name + '</span> Alt:' + v.alt.toFixed(1) + '\u00B0 Brg:' + v.az.toFixed(1) + '\u00B0T ' + v.side;
    }).join('<br>');
  }

  document.getElementById('celestialList').innerHTML = sortedHtml.join('<br>') + top5Html;
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
    // True sextant altitude for stars
    var hoe = parseFloat(document.getElementById('heightOfEye').value) || 15;
    var dip = 1.76 * Math.sqrt(hoe);
    var starRefr = 0;
    if (body.alt > -1) {
      starRefr = 1.0 / Math.tan((body.alt + 7.31 / (body.alt + 4.4)) * Math.PI / 180);
    }
    var starTrueAlt = body.alt - (dip / 60) - (starRefr / 60);
    rows += '<div class="popup-row"><span class="popup-label">Sextant Alt (True)</span><span class="popup-value" style="color:#ff8a65;font-weight:600">' + starTrueAlt.toFixed(2) + '\u00B0</span></div>';
    rows += '<div class="popup-row"><span class="popup-label">Dip / Refr</span><span class="popup-value">-' + dip.toFixed(1) + "' / -" + starRefr.toFixed(1) + "'</span></div>";

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
   DECK VIEW — Panoramic "Standing on Ship" Star View
   Person looking at sky from ship deck, PORT/STBD/HEAD/ASTERN
   Designed so even a kid can understand where to look
   ============================================================ */
var currentStarView = 'deck';  // 'dome' or 'deck'
var deckLookDir = 'ahead';     // 'ahead', 'port', 'stbd', 'astern'

function setStarView(view) {
  currentStarView = view;
  document.getElementById('btnViewDome').style.background = view === 'dome' ? 'var(--accent)' : '';
  document.getElementById('btnViewDome').style.color = view === 'dome' ? '#000' : '';
  document.getElementById('btnViewDeck').style.background = view === 'deck' ? 'var(--accent)' : '';
  document.getElementById('btnViewDeck').style.color = view === 'deck' ? '#000' : '';
  document.getElementById('celestialCanvasWrap').style.display = view === 'dome' ? '' : 'none';
  document.getElementById('deckViewWrap').style.display = view === 'deck' ? '' : 'none';
  if (view === 'deck') renderDeckView();
  else renderCelestial();
}

function setDeckLook(dir) {
  deckLookDir = dir;
  ['port','ahead','stbd','astern'].forEach(function(d) {
    var btn = document.getElementById('deckLook' + d.charAt(0).toUpperCase() + d.slice(1));
    if (btn) {
      btn.style.background = d === dir ? 'var(--accent)' : '';
      btn.style.color = d === dir ? '#000' : '';
    }
  });
  renderDeckView();
}

function renderDeckView() {
  var canvas = document.getElementById('deck-canvas');
  if (!canvas) return;

  var wrap = document.getElementById('deckViewWrap');
  var tabEl = document.getElementById('tab-celestial');
  var pw = 0;
  if (wrap && wrap.offsetWidth > 0) pw = wrap.offsetWidth;
  else if (tabEl && tabEl.offsetWidth > 0) pw = tabEl.offsetWidth - 16;
  if (pw < 100) pw = window.innerWidth - 16;
  if (pw < 100) pw = 360;

  var ph = Math.max(400, Math.min(pw * 1.1, 550));
  canvas.width = pw;
  canvas.height = ph;
  canvas.style.width = pw + 'px';
  canvas.style.height = ph + 'px';

  var ctx = canvas.getContext('2d');
  var w = pw, h = ph;

  var shipHdg = parseFloat(document.getElementById('celestialHdg').value) || 0;
  var hoe = parseFloat(document.getElementById('heightOfEye').value) || 15;
  var lat = STATE.manualMode && STATE.manualLat != null ? STATE.manualLat : (STATE.lat || 25.0);
  var lon = STATE.manualMode && STATE.manualLon != null ? STATE.manualLon : (STATE.lon || 55.0);
  var now = new Date();
  var nightMode = getSettings().nightMode;

  if (typeof Astronomy === 'undefined') {
    ctx.fillStyle = '#030510'; ctx.fillRect(0, 0, w, h);
    ctx.font = '14px IBM Plex Sans'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff4444';
    ctx.fillText('Astronomy library not loaded', w/2, h/2);
    return;
  }

  var observer = new Astronomy.Observer(lat, lon, hoe);
  var date = Astronomy.MakeTime(now);
  var siderealTime = Astronomy.SiderealTime(date);
  var sunHor = getBodyHorizon(date, observer, 'Sun');
  var sunAlt = sunHor.altitude;

  // View center bearing based on look direction
  var lookBrg = shipHdg; // ahead
  if (deckLookDir === 'port') lookBrg = (shipHdg - 90 + 360) % 360;
  else if (deckLookDir === 'stbd') lookBrg = (shipHdg + 90) % 360;
  else if (deckLookDir === 'astern') lookBrg = (shipHdg + 180) % 360;

  var fov = 180; // field of view in degrees (180° panoramic)

  // --- Layout ---
  var seaH = 60;        // sea area at bottom
  var deckH = 90;       // ship deck + person area
  var skyH = h - seaH;  // sky area
  var horizonY = h - seaH; // horizon line Y position

  // --- Draw sky ---
  var skyColor1 = nightMode ? '#0a0000' : (sunAlt > 0 ? '#1a3050' : sunAlt > -6 ? '#1a1030' : sunAlt > -12 ? '#0a0e20' : '#030510');
  var skyColor2 = nightMode ? '#080000' : (sunAlt > 0 ? '#3a5570' : sunAlt > -6 ? '#2a1830' : sunAlt > -12 ? '#060a14' : '#010208');
  var skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, skyColor1);
  skyGrad.addColorStop(1, skyColor2);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, horizonY);

  // --- Draw sea ---
  var seaGrad = ctx.createLinearGradient(0, horizonY, 0, h);
  seaGrad.addColorStop(0, nightMode ? '#060008' : '#0a1828');
  seaGrad.addColorStop(1, nightMode ? '#030004' : '#040c14');
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, horizonY, w, seaH);

  // Horizon line glow
  ctx.strokeStyle = nightMode ? '#330808' : '#334466';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, horizonY); ctx.lineTo(w, horizonY); ctx.stroke();
  // Sea reflection shimmer
  for (var si = 0; si < 8; si++) {
    var sx = Math.random() * w;
    var sy = horizonY + 10 + Math.random() * (seaH - 20);
    var sw = 15 + Math.random() * 30;
    ctx.strokeStyle = nightMode ? '#110205' : '#ffffff08';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + sw, sy); ctx.stroke();
  }

  // --- Draw ship deck (bottom) ---
  var deckTop = horizonY - 5;
  // Ship railing
  ctx.strokeStyle = nightMode ? '#331111' : '#445566';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, deckTop + 2); ctx.lineTo(w, deckTop + 2); ctx.stroke();
  // Railing posts
  for (var rp = 0; rp <= w; rp += 40) {
    ctx.beginPath(); ctx.moveTo(rp, deckTop + 2); ctx.lineTo(rp, deckTop + 12); ctx.stroke();
  }

  // --- Draw person silhouette (center) ---
  var personX = w / 2;
  var personBaseY = deckTop + 3;
  var personScale = 0.7;
  ctx.save();
  ctx.fillStyle = nightMode ? '#331111' : '#1a2a3a';
  ctx.strokeStyle = nightMode ? '#441515' : '#2a3a4a';
  ctx.lineWidth = 1;
  // Body
  ctx.beginPath();
  ctx.moveTo(personX - 8 * personScale, personBaseY);
  ctx.lineTo(personX - 6 * personScale, personBaseY - 35 * personScale);
  ctx.lineTo(personX + 6 * personScale, personBaseY - 35 * personScale);
  ctx.lineTo(personX + 8 * personScale, personBaseY);
  ctx.fill(); ctx.stroke();
  // Head
  ctx.beginPath();
  ctx.arc(personX, personBaseY - 40 * personScale, 6 * personScale, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // Arms pointing up-left and up-right (looking at sky)
  ctx.lineWidth = 2.5 * personScale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(personX - 6 * personScale, personBaseY - 25 * personScale);
  ctx.lineTo(personX - 22 * personScale, personBaseY - 42 * personScale);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(personX + 6 * personScale, personBaseY - 25 * personScale);
  ctx.lineTo(personX + 22 * personScale, personBaseY - 42 * personScale);
  ctx.stroke();
  ctx.restore();

  // --- Labels: LEFT / RIGHT / CENTER direction ---
  var leftDir, rightDir, centerDir;
  if (deckLookDir === 'ahead') { leftDir = 'PORT'; rightDir = 'STBD'; centerDir = 'AHEAD'; }
  else if (deckLookDir === 'port') { leftDir = 'ASTERN'; rightDir = 'AHEAD'; centerDir = 'PORT'; }
  else if (deckLookDir === 'stbd') { leftDir = 'AHEAD'; rightDir = 'ASTERN'; centerDir = 'STBD'; }
  else { leftDir = 'STBD'; rightDir = 'PORT'; centerDir = 'ASTERN'; }

  // Direction labels at bottom of sky
  ctx.font = 'bold 11px IBM Plex Sans';
  ctx.fillStyle = nightMode ? '#ff3333' : '#00e676';
  ctx.textAlign = 'center';
  ctx.fillText(centerDir, w / 2, horizonY - 10);

  ctx.fillStyle = nightMode ? '#aa3333' : '#ff8a65';
  ctx.textAlign = 'left';
  ctx.fillText('\u25C0 ' + leftDir, 8, horizonY - 10);
  ctx.textAlign = 'right';
  ctx.fillText(rightDir + ' \u25B6', w - 8, horizonY - 10);

  // Bearing labels along horizon
  ctx.font = '9px JetBrains Mono';
  ctx.textAlign = 'center';
  ctx.fillStyle = nightMode ? '#552222' : '#5a7a9a';
  for (var bOff = -80; bOff <= 80; bOff += 20) {
    var brgVal = ((lookBrg + bOff) % 360 + 360) % 360;
    var bx = w / 2 + (bOff / (fov / 2)) * (w / 2);
    ctx.fillText(Math.round(brgVal) + '\u00B0', bx, horizonY - 22);
    // tick mark
    ctx.strokeStyle = nightMode ? '#331111' : '#3a5070';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(bx, horizonY - 18); ctx.lineTo(bx, horizonY - 14); ctx.stroke();
  }

  // --- Altitude lines ---
  ctx.font = '8px JetBrains Mono';
  ctx.textAlign = 'right';
  ctx.setLineDash([4, 6]);
  var altColors = nightMode ? '#220808' : '#1a2a40';
  for (var altLine = 15; altLine <= 75; altLine += 15) {
    var aly = horizonY - (altLine / 90) * (skyH - 30);
    ctx.strokeStyle = altColors;
    ctx.lineWidth = 0.3;
    ctx.beginPath(); ctx.moveTo(0, aly); ctx.lineTo(w, aly); ctx.stroke();
    ctx.fillStyle = nightMode ? '#552222' : '#4a6a8a';
    ctx.fillText(altLine + '\u00B0', w - 4, aly - 2);
    // Left side label with helpful text
    ctx.textAlign = 'left';
    if (altLine === 15) ctx.fillText('low', 4, aly - 2);
    else if (altLine === 45) ctx.fillText('halfway up', 4, aly - 2);
    else if (altLine === 75) ctx.fillText('nearly overhead', 4, aly - 2);
    ctx.textAlign = 'right';
  }
  ctx.setLineDash([]);

  // --- Helper function: bearing/alt to x,y on panoramic canvas ---
  function panoramicXY(az, alt) {
    var relBrg = ((az - lookBrg + 540) % 360) - 180; // -180 to +180 relative to look direction
    if (relBrg < -fov / 2 || relBrg > fov / 2) return null; // outside FOV
    if (alt < 0) return null;
    var x = w / 2 + (relBrg / (fov / 2)) * (w / 2);
    var y = horizonY - (alt / 90) * (skyH - 30);
    return { x: x, y: y };
  }

  var nightStarColor = '#ff9966';
  var dayStarColor = '#ffe082';
  var starColor = nightMode ? nightStarColor : dayStarColor;
  var planetColor = nightMode ? '#ff6644' : '#ff8a65';

  // --- Constellation lines ---
  var allStars = {};
  NAV_STARS.forEach(function(s) {
    try {
      var pos = calcStarAzAlt(s[1], s[2], lat, lon, siderealTime);
      allStars[s[0]] = { az: pos.az, alt: pos.alt, mag: s[3], constellation: s[4], bayer: s[5] };
    } catch(e) {}
  });
  CONSTELLATION_EXTRA_STARS.forEach(function(s) {
    try {
      var pos = calcStarAzAlt(s[1], s[2], lat, lon, siderealTime);
      allStars[s[0]] = { az: pos.az, alt: pos.alt };
    } catch(e) {}
  });

  ctx.strokeStyle = nightMode ? '#331111' : '#1a2540';
  ctx.lineWidth = 0.5; ctx.setLineDash([3, 4]);
  CONSTELLATION_LINES.forEach(function(pair) {
    var s1 = allStars[pair[0]], s2 = allStars[pair[1]];
    if (!s1 || !s2) return;
    var p1 = panoramicXY(s1.az, Math.max(0, s1.alt));
    var p2 = panoramicXY(s2.az, Math.max(0, s2.alt));
    if (!p1 || !p2) return;
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  });
  ctx.setLineDash([]);

  // --- Plot solar system bodies ---
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
      var hor = getBodyHorizon(date, observer, b.body);
      if (hor.altitude < -2) return;
      var p = panoramicXY(hor.azimuth, Math.max(0, hor.altitude));
      if (!p) return;

      if (b.type === 'sun') {
        // Sun with warm glow
        var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 30);
        glow.addColorStop(0, '#ffd54faa'); glow.addColorStop(1, '#ffd54f00');
        ctx.beginPath(); ctx.arc(p.x, p.y, 30, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd54f'; ctx.fill();
      } else if (b.type === 'moon') {
        ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = nightMode ? '#ffcccc' : '#e8e8e8'; ctx.fill();
        ctx.strokeStyle = '#ffffff44'; ctx.lineWidth = 1; ctx.stroke();
      } else {
        var pColors = { Venus: '#ffffff', Mars: '#ff4422', Jupiter: '#ffe0a0', Saturn: '#ffcc44', Mercury: '#ccbbaa' };
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = pColors[b.name] || planetColor; ctx.fill();
        // Glow
        var glow2 = ctx.createRadialGradient(p.x, p.y, 3, p.x, p.y, 12);
        glow2.addColorStop(0, (pColors[b.name] || planetColor) + '44'); glow2.addColorStop(1, '#00000000');
        ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fillStyle = glow2; ctx.fill();
      }

      // Label with arrow pointing to body
      ctx.font = 'bold 10px IBM Plex Sans'; ctx.textAlign = 'center';
      ctx.fillStyle = b.type === 'sun' ? '#ffd54f' : b.type === 'moon' ? '#e0e0e0' : planetColor;
      ctx.fillText(b.name, p.x, p.y - 14);
      // Altitude label
      ctx.font = '8px JetBrains Mono';
      ctx.fillText(hor.altitude.toFixed(0) + '\u00B0', p.x, p.y + 16);
    } catch(e) {}
  });

  // --- Plot navigational stars ---
  NAV_STARS.forEach(function(star) {
    var name = star[0], ra = star[1], dec = star[2], mag = star[3], constellation = star[4];
    try {
      var pos = calcStarAzAlt(ra, dec, lat, lon, siderealTime);
      if (pos.alt < 0) return;
      var p = panoramicXY(pos.az, pos.alt);
      if (!p) return;

      var starSize = Math.max(1.5, 5 - mag * 0.9);
      // Star glow
      if (mag < 1.5) {
        var glow3 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, starSize + 6);
        glow3.addColorStop(0, starColor + '88'); glow3.addColorStop(1, starColor + '00');
        ctx.beginPath(); ctx.arc(p.x, p.y, starSize + 6, 0, Math.PI * 2); ctx.fillStyle = glow3; ctx.fill();
      }
      // Star dot
      ctx.beginPath(); ctx.arc(p.x, p.y, starSize, 0, Math.PI * 2);
      ctx.fillStyle = starColor; ctx.fill();

      // Label all visible stars in deck view (more readable)
      if (mag < 2.2) {
        ctx.font = mag < 1.0 ? 'bold 10px IBM Plex Sans' : '9px IBM Plex Sans';
        ctx.textAlign = 'center';
        ctx.fillStyle = starColor;
        ctx.fillText(name, p.x, p.y - starSize - 6);
        // Show altitude helper
        ctx.font = '7px JetBrains Mono';
        ctx.fillStyle = nightMode ? '#aa6644' : '#aa9060';
        ctx.fillText(pos.alt.toFixed(0) + '\u00B0 up', p.x, p.y + starSize + 10);
      }
    } catch(e) {}
  });

  // --- Title bar at top ---
  ctx.fillStyle = nightMode ? '#0a000088' : '#030510aa';
  ctx.fillRect(0, 0, w, 28);
  ctx.font = 'bold 12px IBM Plex Sans'; ctx.textAlign = 'center';
  ctx.fillStyle = nightMode ? '#ff4444' : '#00e676';
  var lookLabel = 'Looking ' + centerDir + ' (Hdg ' + Math.round(lookBrg) + '\u00B0T)';
  ctx.fillText(lookLabel, w / 2, 18);

  // Twilight indicator
  var twText = '';
  if (sunAlt > 0) twText = 'DAYTIME \u2014 Stars not visible to naked eye';
  else if (sunAlt > -6) twText = 'CIVIL TWILIGHT \u2014 Brightest stars visible';
  else if (sunAlt > -12) twText = 'NAUTICAL TWILIGHT \u2014 Best for star sights';
  else if (sunAlt > -18) twText = 'ASTRONOMICAL TWILIGHT';
  else twText = 'NIGHTTIME';
  ctx.font = '9px IBM Plex Sans'; ctx.textAlign = 'center';
  ctx.fillStyle = sunAlt > -6 && sunAlt <= 0 ? '#ff8844' : (sunAlt > -12 && sunAlt <= -6 ? '#44aaff' : '#5a7a9a');
  ctx.fillText(twText, w / 2, h - 8);

  // Helpful instruction at top
  ctx.font = '9px IBM Plex Sans'; ctx.textAlign = 'center';
  ctx.fillStyle = nightMode ? '#663333' : '#6a8aaa';
  ctx.fillText('Stand on deck, face ' + centerDir + '. Stars are shown at their real positions.', w / 2, 42);
  ctx.fillText('\u25C0 ' + leftDir + ' is to your left    |    ' + rightDir + ' is to your right \u25B6', w / 2, 55);
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
    var sunHor = getBodyHorizon(date, observer, 'Sun');
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

    // Sunrise/Sunset — search from today's midnight so we always get TODAY's times
    var todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    var midnightDate = Astronomy.MakeTime(todayMidnight);

    try {
      var rise = Astronomy.SearchRiseSet('Sun', observer, +1, midnightDate, 1);
      if (rise) {
        var rDate = rise.date;
        document.getElementById('sunRise').textContent =
          rDate.getUTCHours().toString().padStart(2,'0') + ':' +
          rDate.getUTCMinutes().toString().padStart(2,'0') + ' UTC';
      }
    } catch(e) { document.getElementById('sunRise').textContent = 'N/A'; }

    try {
      var set = Astronomy.SearchRiseSet('Sun', observer, -1, midnightDate, 1);
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

    // Twilight times (civil -6°, nautical -12°) — also from midnight
    try {
      var civilDawn = Astronomy.SearchAltitude('Sun', observer, +1, midnightDate, 1, -6);
      var civilDusk = Astronomy.SearchAltitude('Sun', observer, -1, midnightDate, 1, -6);
      if (civilDawn && civilDusk) {
        document.getElementById('sunTwilightCivil').textContent =
          civilDawn.date.getUTCHours().toString().padStart(2,'0') + ':' + civilDawn.date.getUTCMinutes().toString().padStart(2,'0') +
          ' / ' +
          civilDusk.date.getUTCHours().toString().padStart(2,'0') + ':' + civilDusk.date.getUTCMinutes().toString().padStart(2,'0') + ' UTC';
      }
    } catch(e) { document.getElementById('sunTwilightCivil').textContent = 'N/A'; }

    try {
      var nautDawn = Astronomy.SearchAltitude('Sun', observer, +1, midnightDate, 1, -12);
      var nautDusk = Astronomy.SearchAltitude('Sun', observer, -1, midnightDate, 1, -12);
      if (nautDawn && nautDusk) {
        document.getElementById('sunTwilightNaut').textContent =
          nautDawn.date.getUTCHours().toString().padStart(2,'0') + ':' + nautDawn.date.getUTCMinutes().toString().padStart(2,'0') +
          ' / ' +
          nautDusk.date.getUTCHours().toString().padStart(2,'0') + ':' + nautDusk.date.getUTCMinutes().toString().padStart(2,'0') + ' UTC';
      }
    } catch(e) { document.getElementById('sunTwilightNaut').textContent = 'N/A'; }

    // True Sextant Altitude calculation
    // Dip = 1.76 * sqrt(height of eye in meters) in arcminutes
    var dip = 1.76 * Math.sqrt(hoe);
    // Refraction (standard): R = 1/tan(alt + 7.31/(alt+4.4)) in arcminutes (approx for alt > 0)
    var sunAltDeg = sunHor.altitude;
    var refraction = 0;
    if (sunAltDeg > -1) {
      refraction = 1.0 / Math.tan((sunAltDeg + 7.31 / (sunAltDeg + 4.4)) * Math.PI / 180);
    }
    // Sun semi-diameter ~ 16.0' (varies 15.7' to 16.3')
    var sd = 16.0;
    // True (observed) altitude = apparent alt - dip - refraction + SD (lower limb)
    var apparentAlt = sunAltDeg;
    var trueAlt = apparentAlt - (dip / 60) - (refraction / 60) + (sd / 60);

    document.getElementById('sunSextantAlt').textContent = trueAlt.toFixed(2) + '\u00B0';
    document.getElementById('sunDip').textContent = '-' + dip.toFixed(1) + "'";
    document.getElementById('sunRefraction').textContent = '-' + refraction.toFixed(1) + "'";
    document.getElementById('sunSD').textContent = '+' + sd.toFixed(1) + "' (LL)";

  } catch(e) {
    console.log('Sun details error:', e);
  }
}
