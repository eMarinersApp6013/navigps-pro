/* ============================================================
   IP GEOLOCATION FALLBACK — GPS-Independent Area Confirmation
   Uses IP address to determine approximate location.
   Accuracy: ~5-50km (city level) — NOT for navigation,
   but confirms you're in the right area (not spoofed to another country).
   ============================================================ */

function toggleIPGeoPopup() {
  var el = document.getElementById('ipGeoPopup');
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

var IP_GEO = {
  lat: null,
  lon: null,
  city: null,
  country: null,
  accuracy: null,  // km
  lastFetch: 0,
  fetching: false
};

function fetchIPGeolocation() {
  if (IP_GEO.fetching) return;
  var now = Date.now();
  if (now - IP_GEO.lastFetch < 300000 && IP_GEO.lat != null) return; // 5min cache

  IP_GEO.fetching = true;
  var statusEl = document.getElementById('ipGeoStatus');
  if (statusEl) {
    statusEl.textContent = 'Fetching IP location...';
    statusEl.style.color = 'var(--text-secondary)';
  }

  // Try multiple free IP geolocation APIs for redundancy
  var apis = [
    {
      url: 'https://ipapi.co/json/',
      parse: function(d) { return { lat: d.latitude, lon: d.longitude, city: d.city, country: d.country_name, accuracy: 25 }; }
    },
    {
      url: 'https://ipwho.is/',
      parse: function(d) { return { lat: d.latitude, lon: d.longitude, city: d.city, country: d.country, accuracy: 30 }; }
    },
    {
      url: 'https://ip-api.com/json/?fields=lat,lon,city,country,status',
      parse: function(d) { return d.status === 'success' ? { lat: d.lat, lon: d.lon, city: d.city, country: d.country, accuracy: 20 } : null; }
    }
  ];

  tryIPGeoAPI(apis, 0);
}

function tryIPGeoAPI(apis, index) {
  if (index >= apis.length) {
    IP_GEO.fetching = false;
    var statusEl = document.getElementById('ipGeoStatus');
    if (statusEl) {
      statusEl.textContent = 'IP geolocation failed — check internet';
      statusEl.style.color = 'var(--danger)';
    }
    return;
  }

  var api = apis[index];
  fetch(api.url, { mode: 'cors' })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var result = api.parse(data);
      if (result && result.lat != null && result.lon != null) {
        IP_GEO.lat = result.lat;
        IP_GEO.lon = result.lon;
        IP_GEO.city = result.city;
        IP_GEO.country = result.country;
        IP_GEO.accuracy = result.accuracy;
        IP_GEO.lastFetch = Date.now();
        IP_GEO.fetching = false;
        displayIPGeoResult();
      } else {
        // Try next API
        tryIPGeoAPI(apis, index + 1);
      }
    })
    .catch(function() {
      tryIPGeoAPI(apis, index + 1);
    });
}

function displayIPGeoResult() {
  var fmt = getSettings().posFormat;
  var latEl = document.getElementById('ipGeoLat');
  var lonEl = document.getElementById('ipGeoLon');
  var locEl = document.getElementById('ipGeoLocation');
  var accEl = document.getElementById('ipGeoAccuracy');
  var statusEl = document.getElementById('ipGeoStatus');
  var compareEl = document.getElementById('ipGeoCompare');

  if (latEl) latEl.textContent = formatLat(IP_GEO.lat, fmt);
  if (lonEl) lonEl.textContent = formatLon(IP_GEO.lon, fmt);
  if (locEl) locEl.textContent = (IP_GEO.city || '--') + ', ' + (IP_GEO.country || '--');
  if (accEl) accEl.textContent = '~' + IP_GEO.accuracy + ' km';
  if (statusEl) {
    statusEl.textContent = 'IP location acquired';
    statusEl.style.color = 'var(--accent)';
  }

  // Compare with GPS position
  if (compareEl && STATE.lat != null) {
    var dist = haversineDistance(IP_GEO.lat, IP_GEO.lon, STATE.lat, STATE.lon);
    var distKm = dist / 1000;
    var distNm = dist / 1852;

    if (distKm < IP_GEO.accuracy * 2) {
      compareEl.className = 'compare-diff ok';
      compareEl.style.display = 'block';
      compareEl.textContent = 'GPS position within IP area (' + distKm.toFixed(0) + ' km) — GPS area appears correct';
    } else if (distKm < 200) {
      compareEl.className = 'compare-diff warn';
      compareEl.style.display = 'block';
      compareEl.textContent = 'GPS ' + distKm.toFixed(0) + ' km from IP location — minor discrepancy, possibly normal';
    } else {
      compareEl.className = 'compare-diff danger';
      compareEl.style.display = 'block';
      compareEl.innerHTML = '<b>GPS SPOOFING LIKELY!</b> GPS is ' + distKm.toFixed(0) + ' km (' + distNm.toFixed(0) + ' nm) from your actual IP area. ' +
        'GPS says: ' + formatLat(STATE.lat, 'dm') + ' ' + formatLon(STATE.lon, 'dm') + '<br>' +
        'IP says you are near: ' + IP_GEO.city + ', ' + IP_GEO.country;
    }
  }
}

/* Use IP position as rough manual position */
function useIPGeoPosition() {
  if (IP_GEO.lat == null) return;
  STATE.manualLat = IP_GEO.lat;
  STATE.manualLon = IP_GEO.lon;
  STATE.manualMode = true;
  document.getElementById('manualBadge').classList.add('show');
  refreshAllDisplays();
}

/* Show IP position on chart */
function showIPGeoOnChart() {
  if (IP_GEO.lat == null) return;
  if (!STATE.map) {
    var chartBtn = document.querySelectorAll('.nav-btn')[1];
    if (chartBtn) chartBtn.click();
    setTimeout(showIPGeoOnChart, 500);
    return;
  }

  // Add IP geo marker
  if (STATE.ipGeoMarker) STATE.map.removeLayer(STATE.ipGeoMarker);
  if (STATE.ipGeoCircle) STATE.map.removeLayer(STATE.ipGeoCircle);

  var ipIcon = L.divIcon({
    className: '',
    html: '<div style="text-align:center"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="#ce93d8" stroke-width="2"/><circle cx="8" cy="8" r="2" fill="#ce93d8"/></svg>' +
          '<div style="font-size:8px;color:#ce93d8;font-weight:700;white-space:nowrap">IP LOC</div></div>',
    iconSize: [16, 24], iconAnchor: [8, 12]
  });
  STATE.ipGeoMarker = L.marker([IP_GEO.lat, IP_GEO.lon], { icon: ipIcon, zIndexOffset: 900 }).addTo(STATE.map);
  STATE.ipGeoCircle = L.circle([IP_GEO.lat, IP_GEO.lon], {
    radius: IP_GEO.accuracy * 1000,
    color: '#ce93d866', fillColor: '#ce93d822', weight: 2, dashArray: '4,4'
  }).addTo(STATE.map);

  STATE.map.flyTo([IP_GEO.lat, IP_GEO.lon], 9, { duration: 1 });
}
