/* ============================================================
   WEATHER OVERLAY (Open-Meteo Marine API)
   With visual compass showing ship heading, wind & current arrows
   ============================================================ */
function fetchWeather() {
  if (STATE.lat == null) return;
  // Show panel immediately with loading state
  var panel = document.getElementById('weatherPanel');
  if (panel && panel.style.display === 'none') {
    panel.style.display = 'block';
    var compact = document.getElementById('weatherCompact');
    if (compact && !compact.innerHTML) compact.innerHTML = '<div class="data-small" style="color:var(--text-dim)">Loading weather data...</div>';
  }
  var now = Date.now();
  if (now - STATE.weatherLastFetch < 1800000 && STATE.weatherData) return; // 30min cache

  var url = 'https://marine-api.open-meteo.com/v1/marine?latitude=' + STATE.lat.toFixed(4) +
    '&longitude=' + STATE.lon.toFixed(4) +
    '&current=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period' +
    '&hourly=wave_height,wave_direction,wave_period,swell_wave_height' +
    '&forecast_hours=6&timezone=UTC';

  // Also fetch wind + current from weather API
  var windUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + STATE.lat.toFixed(4) +
    '&longitude=' + STATE.lon.toFixed(4) +
    '&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,temperature_2m' +
    '&wind_speed_unit=kn&timezone=UTC';

  // Ocean current API
  var currentUrl = 'https://marine-api.open-meteo.com/v1/marine?latitude=' + STATE.lat.toFixed(4) +
    '&longitude=' + STATE.lon.toFixed(4) +
    '&current=ocean_current_velocity,ocean_current_direction' +
    '&timezone=UTC';

  Promise.all([
    fetch(url).then(function(r) { return r.json(); }).catch(function() { return null; }),
    fetch(windUrl).then(function(r) { return r.json(); }).catch(function() { return null; }),
    fetch(currentUrl).then(function(r) { return r.json(); }).catch(function() { return null; })
  ]).then(function(results) {
    var marine = results[0];
    var wind = results[1];
    var current = results[2];
    STATE.weatherData = { marine: marine, wind: wind, current: current };
    STATE.weatherLastFetch = now;
    displayWeather();
  });
}

// Default: compass always visible, data rows below
var weatherExpanded = false;
function toggleWeatherExpand() {
  weatherExpanded = !weatherExpanded;
  var el = document.getElementById('weatherExpanded');
  var icon = document.getElementById('weatherExpandIcon');
  if (el) el.style.display = weatherExpanded ? 'block' : 'none';
  if (icon) icon.textContent = weatherExpanded ? '\u25B2' : '\u25BC';
  if (weatherExpanded) updateWeatherCompass();
}

function displayWeather() {
  var panel = document.getElementById('weatherPanel');
  if (!panel || !STATE.weatherData) return;

  var w = STATE.weatherData.wind;
  var m = STATE.weatherData.marine;
  var compactEl = document.getElementById('weatherCompact');
  var html = '';

  // Wind row
  if (w && w.current) {
    var c = w.current;
    var windDir = c.wind_direction_10m || 0;
    var windSpd = c.wind_speed_10m || 0;
    var gusts = c.wind_gusts_10m || 0;
    html += '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border)">' +
      '<span style="width:50px;font-size:9px;color:#4fc3f7;font-weight:600;text-transform:uppercase">Wind</span>' +
      '<span class="mono" style="font-size:14px;color:#4fc3f7;font-weight:700;min-width:40px">' + windSpd.toFixed(0) + '<span style="font-size:9px"> kn</span></span>' +
      '<span class="mono" style="font-size:11px;color:var(--text-secondary)">' + windDir + '\u00B0</span>' +
      '<span style="font-size:9px;color:var(--text-dim)">Gust</span>' +
      '<span class="mono" style="font-size:12px;color:var(--warning);font-weight:600">' + gusts.toFixed(0) + '</span>' +
      '</div>';
  }

  // Wave & Swell row
  if (m && m.current) {
    var mc = m.current;
    html += '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border)">' +
      '<span style="width:50px;font-size:9px;color:#2a7fff;font-weight:600;text-transform:uppercase">Waves</span>' +
      '<span class="mono" style="font-size:14px;color:#2a7fff;font-weight:700;min-width:40px">' + (mc.wave_height || '--') + '<span style="font-size:9px">m</span></span>' +
      '<span style="font-size:9px;color:var(--text-dim)">T</span>' +
      '<span class="mono" style="font-size:11px;color:var(--text-secondary)">' + (mc.wave_period || '--') + 's</span>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:6px;padding:4px 0">' +
      '<span style="width:50px;font-size:9px;color:#7e57c2;font-weight:600;text-transform:uppercase">Swell</span>' +
      '<span class="mono" style="font-size:14px;color:#7e57c2;font-weight:700;min-width:40px">' + (mc.swell_wave_height || '--') + '<span style="font-size:9px">m</span></span>' +
      '<span style="font-size:9px;color:var(--text-dim)">Dir</span>' +
      '<span class="mono" style="font-size:11px;color:var(--text-secondary)">' + (mc.swell_wave_direction != null ? mc.swell_wave_direction + '\u00B0' : '--') + '</span>' +
      '</div>';
  }

  if (!html) html = '<div class="data-small" style="color:var(--text-dim)">No weather data available</div>';

  if (compactEl) compactEl.innerHTML = html;
  panel.style.display = 'block';

  // Show expanded compass by default
  var expandedEl = document.getElementById('weatherExpanded');
  var expandIcon = document.getElementById('weatherExpandIcon');
  if (expandedEl) expandedEl.style.display = weatherExpanded ? 'block' : 'none';
  if (expandIcon) expandIcon.textContent = weatherExpanded ? '\u25B2' : '\u25BC';

  if (weatherExpanded) updateWeatherCompass();
}

function updateWeatherCompass() {
  var w = STATE.weatherData;
  if (!w) return;

  // Ship heading
  var shipHdg = STATE.cogGPS || STATE.compassHeading || 0;
  var shipIcon = document.getElementById('weatherShipIcon');
  if (shipIcon) shipIcon.setAttribute('transform', 'rotate(' + shipHdg + ',100,100)');

  // Wind arrow
  var windArrowG = document.getElementById('weatherWindArrow');
  if (windArrowG && w.wind && w.wind.current) {
    var windDir = w.wind.current.wind_direction_10m || 0;
    var windSpd = w.wind.current.wind_speed_10m || 0;
    // Wind direction is where wind comes FROM, so arrow points to opposite direction
    var windTo = (windDir + 180) % 360;
    var arrowLen = Math.min(35, 15 + windSpd * 0.8);
    windArrowG.innerHTML = buildArrowSVG(windTo, arrowLen, '#4fc3f7', windSpd.toFixed(0) + ' kn');
  }

  // Current arrow
  var currentArrowG = document.getElementById('weatherCurrentArrow');
  if (currentArrowG) {
    var curData = w.current && w.current.current;
    if (curData && curData.ocean_current_direction != null) {
      var curDir = curData.ocean_current_direction;
      var curSpd = curData.ocean_current_velocity || 0;
      var curLen = Math.min(35, 15 + curSpd * 20);
      currentArrowG.innerHTML = buildArrowSVG(curDir, curLen, '#ff8a65', curSpd.toFixed(1) + ' kn');
    } else {
      currentArrowG.innerHTML = '';
      var curDataEl = document.getElementById('weatherCurrentData');
      if (curDataEl) curDataEl.textContent = 'Ocean current data not available for this location';
    }
  }

  // Swell arrow
  var swellArrowG = document.getElementById('weatherSwellArrow');
  if (swellArrowG && w.marine && w.marine.current) {
    var swellDir = w.marine.current.swell_wave_direction;
    var swellH = w.marine.current.swell_wave_height;
    if (swellDir != null && swellH != null && swellH > 0) {
      var swellTo = (swellDir + 180) % 360; // swell comes FROM this direction
      var swellLen = Math.min(35, 15 + swellH * 6);
      swellArrowG.innerHTML = buildArrowSVG(swellTo, swellLen, '#7e57c2', swellH.toFixed(1) + 'm');
    } else {
      swellArrowG.innerHTML = '';
    }
  }
}

function buildArrowSVG(direction, length, color, label) {
  var rad = direction * Math.PI / 180;
  var cx = 100, cy = 100;
  var tipX = cx + length * Math.sin(rad);
  var tipY = cy - length * Math.cos(rad);
  // Arrowhead
  var headLen = 8;
  var headAngle = 25 * Math.PI / 180;
  var h1x = tipX - headLen * Math.sin(rad - headAngle);
  var h1y = tipY + headLen * Math.cos(rad - headAngle);
  var h2x = tipX - headLen * Math.sin(rad + headAngle);
  var h2y = tipY + headLen * Math.cos(rad + headAngle);
  // Label position (beyond tip)
  var lx = cx + (length + 14) * Math.sin(rad);
  var ly = cy - (length + 14) * Math.cos(rad);

  return '<line x1="' + cx + '" y1="' + cy + '" x2="' + tipX + '" y2="' + tipY + '" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round"/>' +
    '<polygon points="' + tipX + ',' + tipY + ' ' + h1x + ',' + h1y + ' ' + h2x + ',' + h2y + '" fill="' + color + '"/>' +
    '<text x="' + lx + '" y="' + (ly + 3) + '" text-anchor="middle" fill="' + color + '" font-size="8" font-family="JetBrains Mono" font-weight="600">' + label + '</text>';
}

function getWindArrow(deg) {
  var arrows = ['\u2193','\u2199','\u2190','\u2196','\u2191','\u2197','\u2192','\u2198'];
  return arrows[Math.round(deg / 45) % 8];
}

// Auto-fetch weather when position is first available
var _weatherCheckInterval = setInterval(function() {
  if (STATE.lat != null) {
    clearInterval(_weatherCheckInterval);
    fetchWeather();
  }
}, 3000);
