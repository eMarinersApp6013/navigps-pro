/* ============================================================
   WEATHER OVERLAY (Open-Meteo Marine API)
   With visual compass showing ship heading, wind & current arrows
   ============================================================ */
function fetchWeather() {
  if (STATE.lat == null) return;
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

  if (w && w.current) {
    var c = w.current;
    var windDir = c.wind_direction_10m || 0;
    var windSpd = c.wind_speed_10m || 0;
    var gusts = c.wind_gusts_10m || 0;
    var windArrow = getWindArrow(windDir);
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px">' +
      '<div style="text-align:center"><div class="data-medium mono spd-value">' + windSpd.toFixed(0) + '</div><div class="data-label">Wind kn</div></div>' +
      '<div style="text-align:center"><div class="data-medium mono">' + windArrow + ' ' + windDir + '\u00B0</div><div class="data-label">Direction</div></div>' +
      '<div style="text-align:center"><div class="data-medium mono" style="color:var(--warning)">' + gusts.toFixed(0) + '</div><div class="data-label">Gusts kn</div></div>' +
      '</div>';
  }

  if (m && m.current) {
    var mc = m.current;
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">' +
      '<div style="text-align:center"><div class="data-medium mono" style="color:var(--info)">' + (mc.wave_height || '--') + '</div><div class="data-label">Wave H (m)</div></div>' +
      '<div style="text-align:center"><div class="data-medium mono">' + (mc.wave_period || '--') + '</div><div class="data-label">Period (s)</div></div>' +
      '<div style="text-align:center"><div class="data-medium mono">' + (mc.swell_wave_height || '--') + '</div><div class="data-label">Swell (m)</div></div>' +
      '</div>';
  }

  if (!html) html = '<div class="data-small" style="color:var(--text-dim)">No weather data available</div>';

  if (compactEl) compactEl.innerHTML = html;
  panel.style.display = 'block';

  // Update compass if expanded
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
      // No current data from API — show note
      currentArrowG.innerHTML = '';
      var curDataEl = document.getElementById('weatherCurrentData');
      if (curDataEl) curDataEl.textContent = 'Ocean current data not available for this location';
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
