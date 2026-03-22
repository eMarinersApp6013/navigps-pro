/* ============================================================
   WEATHER OVERLAY (Open-Meteo Marine API)
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

  // Also fetch wind from regular weather API
  var windUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + STATE.lat.toFixed(4) +
    '&longitude=' + STATE.lon.toFixed(4) +
    '&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,temperature_2m' +
    '&wind_speed_unit=kn&timezone=UTC';

  Promise.all([
    fetch(url).then(function(r) { return r.json(); }).catch(function() { return null; }),
    fetch(windUrl).then(function(r) { return r.json(); }).catch(function() { return null; })
  ]).then(function(results) {
    var marine = results[0];
    var wind = results[1];
    STATE.weatherData = { marine: marine, wind: wind };
    STATE.weatherLastFetch = now;
    displayWeather();
  });
}

function displayWeather() {
  var panel = document.getElementById('weatherPanel');
  if (!panel || !STATE.weatherData) return;

  var w = STATE.weatherData.wind;
  var m = STATE.weatherData.marine;
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

  panel.innerHTML = html;
  panel.style.display = 'block';
}

function getWindArrow(deg) {
  var arrows = ['\u2193','\u2199','\u2190','\u2196','\u2191','\u2197','\u2192','\u2198'];
  return arrows[Math.round(deg / 45) % 8];
}
