/* ============================================================
   CELESTIAL VIEW (Stars, Planets, Sun, Moon + Constellations)
   ============================================================ */

var celestialBodies = [];

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
  var haR = ha * Math.PI / 180;
  var decR = dec * Math.PI / 180;
  var latR = lat * Math.PI / 180;
  var sinAlt = Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(haR);
  var alt = Math.asin(sinAlt) * 180 / Math.PI;
  var cosAz = (Math.sin(decR) - Math.sin(latR) * sinAlt) / (Math.cos(latR) * Math.cos(Math.asin(sinAlt)));
  var az = Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180 / Math.PI;
  if (Math.sin(haR) > 0) az = 360 - az;
  return { az: az, alt: alt };
}

function bodyScreenPos(az, alt, shipHdg, viewSpan, w, horizonY) {
  var leftBearing = (shipHdg - viewSpan / 2 + 360) % 360;
  var relB = ((az - leftBearing + 360) % 360);
  if (relB > viewSpan + 10) return null;
  var x = (relB / viewSpan) * w;
  var y = horizonY - (alt / 90) * (horizonY - 25);
  if (x < -20 || x > w + 20) return null;
  return { x: x, y: y };
}

function renderCelestial() {
  var canvas = document.getElementById('celestial-canvas');
  if (!canvas) return;

  var parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight || 300;

  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim();
  ctx.fillRect(0, 0, w, h);

  var shipHdg = parseFloat(document.getElementById('celestialHdg').value) || 0;
  var hoe = parseFloat(document.getElementById('heightOfEye').value) || 15;
  var lat = STATE.manualMode && STATE.manualLat != null ? STATE.manualLat : (STATE.lat || 25.0);
  var lon = STATE.manualMode && STATE.manualLon != null ? STATE.manualLon : (STATE.lon || 55.0);
  var now = new Date();

  var horizonY = h * 0.65;
  var nightMode = getSettings().nightMode;

  var skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  if (nightMode) {
    skyGrad.addColorStop(0, '#0a0000');
    skyGrad.addColorStop(1, '#1a0000');
  } else {
    skyGrad.addColorStop(0, '#050a15');
    skyGrad.addColorStop(1, '#0a1525');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, horizonY);

  var seaGrad = ctx.createLinearGradient(0, horizonY, 0, h);
  if (nightMode) {
    seaGrad.addColorStop(0, '#100000');
    seaGrad.addColorStop(1, '#080000');
  } else {
    seaGrad.addColorStop(0, '#0a1520');
    seaGrad.addColorStop(1, '#060c14');
  }
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, horizonY, w, h - horizonY);

  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--horizon-color').trim();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(w, horizonY);
  ctx.stroke();

  ctx.font = '9px JetBrains Mono';
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-dim').trim();
  ctx.textAlign = 'center';

  var viewSpan = 180;
  var leftBearing = (shipHdg - viewSpan / 2 + 360) % 360;

  for (var b = 0; b < 360; b += 10) {
    var relB = ((b - leftBearing + 360) % 360);
    if (relB > viewSpan) continue;
    var x = (relB / viewSpan) * w;
    ctx.beginPath();
    ctx.moveTo(x, horizonY - (b % 30 === 0 ? 8 : 4));
    ctx.lineTo(x, horizonY + (b % 30 === 0 ? 8 : 4));
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim();
    ctx.stroke();
    if (b % 30 === 0) {
      var label = b + '\u00B0';
      if (b === 0) label = 'N';
      else if (b === 90) label = 'E';
      else if (b === 180) label = 'S';
      else if (b === 270) label = 'W';
      ctx.fillText(label, x, horizonY + 20);
    }
  }

  ctx.font = '11px IBM Plex Sans';
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
  ctx.textAlign = 'left';
  ctx.fillText('\u25C0 PORT', 8, horizonY - 20);
  ctx.textAlign = 'right';
  ctx.fillText('STBD \u25B6', w - 8, horizonY - 20);
  ctx.textAlign = 'center';
  ctx.fillText('\u25B2 HEAD', w / 2, 16);

  ctx.beginPath();
  ctx.moveTo(w / 2, horizonY - 15);
  ctx.lineTo(w / 2 - 5, horizonY);
  ctx.lineTo(w / 2 + 5, horizonY);
  ctx.closePath();
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  ctx.fill();

  var observer = new Astronomy.Observer(lat, lon, hoe);
  var date = Astronomy.MakeTime(now);
  var siderealTime = Astronomy.SiderealTime(date);

  var typeColors = {
    sun: getComputedStyle(document.documentElement).getPropertyValue('--sun-color').trim(),
    moon: getComputedStyle(document.documentElement).getPropertyValue('--moon-color').trim(),
    planet: getComputedStyle(document.documentElement).getPropertyValue('--planet-color').trim(),
    star: getComputedStyle(document.documentElement).getPropertyValue('--star-color').trim()
  };

  var allStars = {};
  NAV_STARS.forEach(function(s) {
    try {
      var pos = calcStarAzAlt(s[1], s[2], lat, lon, siderealTime);
      allStars[s[0]] = { ra: s[1], dec: s[2], az: pos.az, alt: pos.alt };
    } catch(e) {}
  });
  CONSTELLATION_EXTRA_STARS.forEach(function(s) {
    try {
      var pos = calcStarAzAlt(s[1], s[2], lat, lon, siderealTime);
      allStars[s[0]] = { ra: s[1], dec: s[2], az: pos.az, alt: pos.alt };
    } catch(e) {}
  });

  ctx.strokeStyle = nightMode ? '#331111' : '#1a2540';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([4, 3]);
  CONSTELLATION_LINES.forEach(function(pair) {
    var star1 = allStars[pair[0]];
    var star2 = allStars[pair[1]];
    if (!star1 || !star2) return;
    if (star1.alt < -5 && star2.alt < -5) return;
    var p1 = bodyScreenPos(star1.az, star1.alt, shipHdg, viewSpan, w, horizonY);
    var p2 = bodyScreenPos(star2.az, star2.alt, shipHdg, viewSpan, w, horizonY);
    if (!p1 || !p2) return;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  celestialBodies = [];

  var bodies = [
    { name: 'Sun', body: 'Sun', type: 'sun' },
    { name: 'Moon', body: 'Moon', type: 'moon' },
    { name: 'Venus', body: 'Venus', type: 'planet' },
    { name: 'Mars', body: 'Mars', type: 'planet' },
    { name: 'Jupiter', body: 'Jupiter', type: 'planet' },
    { name: 'Saturn', body: 'Saturn', type: 'planet' },
    { name: 'Mercury', body: 'Mercury', type: 'planet' },
  ];

  var listHtml = [];

  bodies.forEach(function(b) {
    try {
      var hor = Astronomy.Horizon(date, observer, b.body, 'normal');
      var alt = hor.altitude;
      var az = hor.azimuth;
      var pos = plotBody(ctx, b.name, az, alt, shipHdg, viewSpan, w, h, horizonY, typeColors[b.type], b.type, b.type === 'sun' ? 8 : b.type === 'moon' ? 6 : 4);

      if (pos) {
        celestialBodies.push({
          name: b.name, type: b.type, az: az, alt: alt,
          x: pos.x, y: pos.y, r: b.type === 'sun' ? 10 : b.type === 'moon' ? 8 : 6,
          constellation: '--', bayer: '--', magnitude: '--',
          extra: b.type === 'planet' ? 'Planet' : b.type === 'sun' ? 'Star (our Sun)' : 'Natural Satellite'
        });
      }

      var relBrg = ((az - shipHdg + 360) % 360);
      var side = relBrg <= 180 ? (relBrg < 10 ? 'AHEAD' : 'STBD') : (relBrg > 350 ? 'AHEAD' : 'PORT');
      listHtml.push('<span style="color:' + typeColors[b.type] + '">\u25CF ' + b.name + '</span> Alt:' + alt.toFixed(1) + '\u00B0 Brg:' + az.toFixed(1) + '\u00B0T ' + side);
    } catch(e) {}
  });

  NAV_STARS.forEach(function(star) {
    var name = star[0], ra = star[1], dec = star[2], mag = star[3], constellation = star[4], bayer = star[5];
    try {
      var pos = calcStarAzAlt(ra, dec, lat, lon, siderealTime);
      var alt = pos.alt;
      var az = pos.az;

      if (alt > -2) {
        var screenPos = plotBody(ctx, name, az, alt, shipHdg, viewSpan, w, h, horizonY, typeColors.star, 'star', 2.5);

        if (screenPos) {
          celestialBodies.push({
            name: name, type: 'star', az: az, alt: alt,
            x: screenPos.x, y: screenPos.y, r: 8,
            constellation: constellation, bayer: bayer, magnitude: mag,
            ra: ra, dec: dec
          });
        }

        if (alt > 5) {
          var relBrg = ((az - shipHdg + 360) % 360);
          var side = relBrg <= 180 ? (relBrg < 10 ? 'AHEAD' : 'STBD') : (relBrg > 350 ? 'AHEAD' : 'PORT');
          listHtml.push('<span style="color:' + typeColors.star + '">\u2605 ' + name + '</span> Alt:' + alt.toFixed(1) + '\u00B0 Brg:' + az.toFixed(1) + '\u00B0T ' + side);
        }
      }
    } catch(e) {}
  });

  CONSTELLATION_EXTRA_STARS.forEach(function(star) {
    var name = star[0], ra = star[1], dec = star[2];
    try {
      var pos = calcStarAzAlt(ra, dec, lat, lon, siderealTime);
      if (pos.alt > -2) {
        plotBody(ctx, '', pos.az, pos.alt, shipHdg, viewSpan, w, h, horizonY, typeColors.star + '88', 'star', 1.5);
      }
    } catch(e) {}
  });

  var constellationCenters = {};
  CONSTELLATION_LINES.forEach(function(pair) {
    var star1 = allStars[pair[0]];
    var star2 = allStars[pair[1]];
    if (!star1 || !star2) return;
    var navStar = NAV_STARS.find(function(s) { return s[0] === pair[0] || s[0] === pair[1]; });
    if (!navStar) return;
    var cName = navStar[4];
    if (!constellationCenters[cName]) constellationCenters[cName] = { xs: [], ys: [] };
    var p1 = bodyScreenPos(star1.az, star1.alt, shipHdg, viewSpan, w, horizonY);
    var p2 = bodyScreenPos(star2.az, star2.alt, shipHdg, viewSpan, w, horizonY);
    if (p1) { constellationCenters[cName].xs.push(p1.x); constellationCenters[cName].ys.push(p1.y); }
    if (p2) { constellationCenters[cName].xs.push(p2.x); constellationCenters[cName].ys.push(p2.y); }
  });

  ctx.font = '9px IBM Plex Sans';
  ctx.fillStyle = nightMode ? '#552222' : '#3a5070';
  ctx.textAlign = 'center';
  Object.entries(constellationCenters).forEach(function(entry) {
    var name = entry[0], pts = entry[1];
    if (pts.xs.length < 2) return;
    var cx = pts.xs.reduce(function(a,b){return a+b;},0) / pts.xs.length;
    var cy = pts.ys.reduce(function(a,b){return a+b;},0) / pts.ys.length;
    if (cx > 10 && cx < w - 10 && cy > 20 && cy < h - 20) {
      ctx.fillText(name, cx, cy - 12);
    }
  });

  document.getElementById('celestialList').innerHTML = listHtml.join('<br>');
}

function plotBody(ctx, name, az, alt, shipHdg, viewSpan, w, h, horizonY, color, type, size) {
  var pos = bodyScreenPos(az, alt, shipHdg, viewSpan, w, horizonY);
  if (!pos) return null;

  var x = pos.x, y = pos.y;

  ctx.beginPath();
  if (type === 'sun') {
    var glow = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
    glow.addColorStop(0, color + 'aa');
    glow.addColorStop(1, color + '00');
    ctx.fillStyle = glow;
    ctx.arc(x, y, size * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
  }

  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = alt < 0 ? color + '44' : color;
  ctx.fill();

  if (name) {
    ctx.font = (type === 'star' ? '8px' : '10px') + ' JetBrains Mono';
    ctx.fillStyle = alt < 0 ? color + '66' : color;
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y - size - 4);
  }

  return { x: x, y: y };
}

function initCelestialClick() {
  var canvas = document.getElementById('celestial-canvas');
  if (!canvas) return;

  canvas.addEventListener('click', function(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    var my = (e.clientY - rect.top) * (canvas.height / rect.height);

    var closest = null;
    var minDist = Infinity;

    celestialBodies.forEach(function(body) {
      var dx = mx - body.x;
      var dy = my - body.y;
      var dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < body.r + 10 && dist < minDist) {
        minDist = dist;
        closest = body;
      }
    });

    if (closest) {
      showStarPopup(closest, e.clientX, e.clientY);
    } else {
      closeStarPopup();
    }
  });
}

function showStarPopup(body, clickX, clickY) {
  var popup = document.getElementById('starDetailPopup');
  var title = document.getElementById('starPopupTitle');
  var content = document.getElementById('starPopupContent');

  var typeLabel = body.type === 'star' ? '\u2605 Star' : body.type === 'planet' ? '\u25CF Planet' : body.type === 'sun' ? '\u2600 Sun' : '\u263D Moon';
  var typeColor = body.type === 'star' ? 'var(--star-color)' : body.type === 'planet' ? 'var(--planet-color)' : body.type === 'sun' ? 'var(--sun-color)' : 'var(--moon-color)';

  title.textContent = body.name;
  title.style.color = typeColor;

  var rows = '<div class="popup-row"><span class="popup-label">Type</span><span class="popup-value">' + typeLabel + '</span></div>' +
    '<div class="popup-row"><span class="popup-label">Altitude</span><span class="popup-value">' + body.alt.toFixed(2) + '\u00B0</span></div>' +
    '<div class="popup-row"><span class="popup-label">Azimuth (True)</span><span class="popup-value">' + body.az.toFixed(2) + '\u00B0</span></div>';

  if (body.type === 'star') {
    rows += '<div class="popup-row"><span class="popup-label">Constellation</span><span class="popup-value">' + body.constellation + '</span></div>' +
      '<div class="popup-row"><span class="popup-label">Designation</span><span class="popup-value">' + body.bayer + '</span></div>' +
      '<div class="popup-row"><span class="popup-label">Magnitude</span><span class="popup-value">' + (typeof body.magnitude === 'number' ? body.magnitude.toFixed(2) : body.magnitude) + '</span></div>';
    if (body.ra !== undefined) {
      var raH = Math.floor(body.ra / 15);
      var raM = ((body.ra / 15 - raH) * 60).toFixed(1);
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
  var pw = popup.offsetWidth;
  var ph = popup.offsetHeight;
  var px = clickX + 10;
  var py = clickY - ph / 2;
  if (px + pw > window.innerWidth - 10) px = clickX - pw - 10;
  if (py < 10) py = 10;
  if (py + ph > window.innerHeight - 10) py = window.innerHeight - ph - 10;
  popup.style.left = px + 'px';
  popup.style.top = py + 'px';
}

function closeStarPopup() {
  document.getElementById('starDetailPopup').style.display = 'none';
}

function useLiveHeading() {
  var hdg = STATE.compassHeading || STATE.cogGPS;
  if (hdg != null) {
    document.getElementById('celestialHdg').value = Math.round(hdg);
    saveSetting('celestialHdg', Math.round(hdg).toString());
    renderCelestial();
  }
}
