/* ============================================================
   MAP (Leaflet + OpenSeaMap + Depth + Port Details + Search)
   ============================================================ */
var mapCentered = false;

function initMap() {
  STATE.map = L.map('chart-map', {
    center: [25.0, 55.0], zoom: 8,
    zoomControl: true, attributionControl: true
  });

  // Base layer - CartoDB Voyager (English)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    subdomains: 'abcd'
  }).addTo(STATE.map);

  // GEBCO Bathymetry depth layer — increased opacity for visibility
  STATE.depthLayer = L.tileLayer.wms('https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv', {
    layers: 'GEBCO_LATEST',
    format: 'image/png',
    transparent: true,
    opacity: 0.55,
    attribution: '&copy; <a href="https://www.gebco.net">GEBCO</a>'
  });
  if (getSettings().depthLayer) STATE.depthLayer.addTo(STATE.map);

  // OpenSeaMap seamark layer
  STATE.seamarkLayer = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
    maxZoom: 18, opacity: 0.9,
    attribution: '&copy; <a href="https://www.openseamap.org">OpenSeaMap</a>'
  });
  if (getSettings().seamarks) STATE.seamarkLayer.addTo(STATE.map);

  // Port/harbour layer
  STATE.portLayer = L.tileLayer('https://tiles.openseamap.org/harbours/{z}/{x}/{y}.png', {
    maxZoom: 18, opacity: 1.0
  });
  STATE.portLayer.addTo(STATE.map);

  document.getElementById('chart-legend').style.display = 'block';

  // Vessel marker
  var vesselIcon = L.divIcon({
    className: '',
    html: '<svg width="24" height="24" viewBox="0 0 24 24" style="filter:drop-shadow(0 0 4px rgba(0,230,118,.6))"><polygon points="12,2 6,20 12,16 18,20" fill="#00e676" stroke="#000" stroke-width="1"/></svg>',
    iconSize: [24, 24], iconAnchor: [12, 12]
  });
  STATE.marker = L.marker([25.0, 55.0], { icon: vesselIcon }).addTo(STATE.map);
  STATE.trackLine = L.polyline([], { color: '#00e67688', weight: 2 }).addTo(STATE.map);
  STATE.accCircle = L.circle([25.0, 55.0], { radius: 50, color: '#2a7fff44', fillColor: '#2a7fff22', weight: 1 }).addTo(STATE.map);

  // Port click handler via Overpass API
  STATE.map.on('click', onMapClick);

  // Init search bar events
  initChartSearch();

  // Zoom scale indicator
  updateZoomScale();
  STATE.map.on('zoomend', updateZoomScale);
  STATE.map.on('moveend', updateZoomScale);

  // Fetch depth at ship position periodically
  setInterval(fetchDepthAtShip, 15000);
  setTimeout(fetchDepthAtShip, 3000);
}

/* Zoom scale indicator */
function updateZoomScale() {
  if (!STATE.map) return;
  var el = document.getElementById('zoomScaleIndicator');
  var txt = document.getElementById('zoomScaleText');
  if (!el || !txt) return;
  el.style.display = 'block';
  var zoom = STATE.map.getZoom();
  // Approximate scale based on zoom level at equator
  var scaleMap = {
    1: '1:500M', 2: '1:250M', 3: '1:150M', 4: '1:70M', 5: '1:35M',
    6: '1:15M', 7: '1:10M', 8: '1:4M', 9: '1:2M', 10: '1:1M',
    11: '1:500K', 12: '1:250K', 13: '1:150K', 14: '1:70K', 15: '1:35K',
    16: '1:15K', 17: '1:8K', 18: '1:4K', 19: '1:2K'
  };
  // Approximate nautical mile range for the view
  var center = STATE.map.getCenter();
  var bounds = STATE.map.getBounds();
  var widthDeg = bounds.getEast() - bounds.getWest();
  var nmWidth = widthDeg * 60 * Math.cos(center.lat * Math.PI / 180);
  var nmLabel = nmWidth < 1 ? nmWidth.toFixed(2) + ' nm' : nmWidth < 10 ? nmWidth.toFixed(1) + ' nm' : Math.round(nmWidth) + ' nm';
  var scale = scaleMap[Math.round(zoom)] || '1:' + Math.round(591657550.5 / Math.pow(2, zoom));
  txt.textContent = scale + ' | ' + nmLabel;
}

/* Fetch depth at ship position using GEBCO WCS */
function fetchDepthAtShip() {
  var lat = STATE.manualMode && STATE.manualLat != null ? STATE.manualLat : STATE.lat;
  var lon = STATE.manualMode && STATE.manualLon != null ? STATE.manualLon : STATE.lon;
  if (lat == null || lon == null) return;

  // Use GEBCO WMS GetFeatureInfo to get depth at point
  var bbox = (lon - 0.001) + ',' + (lat - 0.001) + ',' + (lon + 0.001) + ',' + (lat + 0.001);
  var url = 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?' +
    'SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&LAYERS=GEBCO_LATEST&QUERY_LAYERS=GEBCO_LATEST' +
    '&INFO_FORMAT=text/plain&SRS=EPSG:4326&BBOX=' + bbox +
    '&WIDTH=3&HEIGHT=3&X=1&Y=1';

  fetch(url).then(function(r) { return r.text(); }).then(function(text) {
    // Parse depth value from response
    var match = text.match(/value_0\s*[:=]\s*['"]?(-?[\d.]+)/i) ||
                text.match(/(-?[\d.]+)\s*$/m);
    if (match) {
      var depth = parseFloat(match[1]);
      // GEBCO returns negative values for below sea level
      var displayDepth = depth < 0 ? Math.abs(depth) : depth;
      chartDepthAtCursor = displayDepth;
      var depthEl = document.getElementById('cursorDepth');
      if (depthEl) {
        depthEl.textContent = displayDepth.toFixed(1);
        depthEl.style.fontWeight = '700';
        depthEl.style.fontSize = '13px';
      }
      updateUKC();
    }
  }).catch(function() {});
}

function updateChartLayers() {
  if (!STATE.map) return;
  var s = getSettings();
  if (s.seamarks && !STATE.map.hasLayer(STATE.seamarkLayer)) STATE.seamarkLayer.addTo(STATE.map);
  else if (!s.seamarks && STATE.map.hasLayer(STATE.seamarkLayer)) STATE.map.removeLayer(STATE.seamarkLayer);
  if (s.depthLayer && !STATE.map.hasLayer(STATE.depthLayer)) STATE.depthLayer.addTo(STATE.map);
  else if (!s.depthLayer && STATE.map.hasLayer(STATE.depthLayer)) STATE.map.removeLayer(STATE.depthLayer);
}

function updateMap() {
  if (!STATE.map || STATE.lat == null) return;
  var posLat = STATE.manualMode && STATE.manualLat != null ? STATE.manualLat : STATE.lat;
  var posLon = STATE.manualMode && STATE.manualLon != null ? STATE.manualLon : STATE.lon;
  var pos = [posLat, posLon];

  STATE.marker.setLatLng(pos);
  var hdg = STATE.cogGPS || STATE.compassHeading || 0;
  var el = STATE.marker.getElement();
  if (el) {
    var svg = el.querySelector('svg');
    if (svg) svg.style.transform = 'rotate(' + hdg + 'deg)';
  }

  STATE.accCircle.setLatLng(pos);
  if (STATE.accuracy) STATE.accCircle.setRadius(STATE.accuracy);
  if (getSettings().trackTrail) STATE.trackLine.setLatLngs(STATE.trackPoints);

  if (!mapCentered) {
    STATE.map.setView(pos, 14);
    mapCentered = true;
  }

  // Update MOB line if active
  if (STATE.mobPosition && STATE.mobLine) {
    STATE.mobLine.setLatLngs([pos, [STATE.mobPosition.lat, STATE.mobPosition.lon]]);
  }
}

/* ============================================================
   PORT DETAILS ON CLICK (Overpass API)
   ============================================================ */
function onMapClick(e) {
  var lat = e.latlng.lat;
  var lon = e.latlng.lng;
  var radius = 500; // meters
  var bbox = (lat - 0.005) + ',' + (lon - 0.005) + ',' + (lat + 0.005) + ',' + (lon + 0.005);

  var query = '[out:json][timeout:10];(' +
    'node["seamark:type"~"harbour|anchorage|mooring|radio_station|pilot_boarding"](' + bbox + ');' +
    'node["harbour"](' + bbox + ');' +
    'node["leisure"="marina"](' + bbox + ');' +
    'way["seamark:type"~"harbour|anchorage"](' + bbox + ');' +
    ');out body;';

  var url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

  // Show loading popup
  var loadingPopup = L.popup({ maxWidth: 280 })
    .setLatLng([lat, lon])
    .setContent('<div style="text-align:center;padding:8px"><div class="port-loading-spinner"></div><span style="font-size:11px;color:var(--text-secondary)">Loading port data...</span></div>')
    .openOn(STATE.map);

  fetch(url, { headers: { 'Accept-Language': 'en' } }).then(function(r) { return r.json(); }).then(function(data) {
    if (!data.elements || data.elements.length === 0) {
      STATE.map.closePopup(loadingPopup);
      return;
    }
    var el = data.elements[0];
    var tags = el.tags || {};
    var name = tags['name:en'] || tags['int_name'] || tags.name || tags['seamark:name'] || tags['harbour:name'] || 'Unknown Port';
    var plat = el.lat || lat;
    var plon = el.lon || lon;

    var html = buildPortDetailHtml(name, plat, plon, tags);

    L.popup({ maxWidth: 320 })
      .setLatLng([plat, plon])
      .setContent(html)
      .openOn(STATE.map);
  }).catch(function() { STATE.map.closePopup(loadingPopup); });
}

/* Build rich port detail HTML */
function buildPortDetailHtml(name, lat, lon, tags) {
  var html = '<div style="min-width:200px">';
  html += '<b style="font-size:14px;color:#ff8a65">' + name + '</b><br>';
  html += '<span style="font-size:11px;color:#888">' + lat.toFixed(4) + ', ' + lon.toFixed(4) + '</span><br>';

  if (tags['seamark:harbour:category']) html += '<div style="margin:2px 0"><b style="color:#4fc3f7">Type:</b> ' + tags['seamark:harbour:category'] + '</div>';

  // VHF Channels
  var vhf = tags.vhf || tags['seamark:radio_station:channel'] || tags['seamark:radio_station:channel:1'] ||
            tags['VHF'] || tags['contact:vhf'] || '';
  if (vhf) html += '<div style="margin:2px 0"><b style="color:#00e676">VHF Ch:</b> ' + vhf + '</div>';

  // Additional VHF channels
  for (var i = 2; i <= 5; i++) {
    var chKey = 'seamark:radio_station:channel:' + i;
    if (tags[chKey]) html += '<div style="margin:1px 0;padding-left:12px"><b style="color:#00e676">VHF Ch ' + i + ':</b> ' + tags[chKey] + '</div>';
  }

  // MF/HF Radio
  if (tags['seamark:radio_station:frequency'] || tags['frequency']) {
    html += '<div style="margin:2px 0"><b style="color:#ce93d8">MF/HF:</b> ' + (tags['seamark:radio_station:frequency'] || tags['frequency']) + ' kHz</div>';
  }

  // NAVTEX
  if (tags['navtex'] || tags['seamark:radio_station:category'] === 'navtex') {
    html += '<div style="margin:2px 0"><b style="color:#ffab00">NAVTEX:</b> ' + (tags['navtex'] || 'Available') + '</div>';
  }

  // Radio category (coast_radio, port_radio, etc.)
  if (tags['seamark:radio_station:category']) {
    html += '<div style="margin:2px 0"><b>Radio:</b> ' + tags['seamark:radio_station:category'].replace(/_/g, ' ') + '</div>';
  }

  // Call sign
  if (tags['seamark:radio_station:callsign'] || tags['call_sign']) {
    html += '<div style="margin:2px 0"><b>Call Sign:</b> ' + (tags['seamark:radio_station:callsign'] || tags['call_sign']) + '</div>';
  }

  if (tags['seamark:anchorage:category']) html += '<div style="margin:2px 0"><b>Anchorage:</b> ' + tags['seamark:anchorage:category'] + '</div>';
  if (tags['seamark:pilot_boarding:category']) html += '<div style="margin:2px 0"><b style="color:#4fc3f7">Pilot:</b> ' + tags['seamark:pilot_boarding:category'] + '</div>';
  if (tags['seamark:harbour:master']) html += '<div style="margin:2px 0"><b>Harbour Master:</b> ' + tags['seamark:harbour:master'] + '</div>';
  if (tags.description) html += '<div style="margin:2px 0"><b>Info:</b> ' + tags.description + '</div>';
  if (tags.website) html += '<div style="margin:2px 0"><a href="' + tags.website + '" target="_blank" style="color:#2a7fff">Website</a></div>';
  if (tags.phone) html += '<div style="margin:2px 0"><b>Phone:</b> ' + tags.phone + '</div>';
  if (tags.email || tags['contact:email']) html += '<div style="margin:2px 0"><b>Email:</b> ' + (tags.email || tags['contact:email']) + '</div>';

  html += '</div>';
  return html;
}

/* ============================================================
   CHART SEARCH BAR (Nominatim)
   ============================================================ */
function initChartSearch() {
  var input = document.getElementById('chartSearchInput');
  var results = document.getElementById('chartSearchResults');
  if (!input || !results) return;

  input.addEventListener('input', function() {
    var q = input.value.trim();
    if (q.length < 3) { results.style.display = 'none'; return; }
    clearTimeout(STATE.searchTimeout);
    STATE.searchTimeout = setTimeout(function() {
      doChartSearch(q);
    }, 300);
  });

  input.addEventListener('blur', function() {
    setTimeout(function() { results.style.display = 'none'; }, 200);
  });
}

function doChartSearch(q) {
  var url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q) +
    '&format=json&limit=8&addressdetails=1';
  var results = document.getElementById('chartSearchResults');

  fetch(url, { headers: { 'Accept-Language': 'en' } }).then(function(r) { return r.json(); }).then(function(data) {
    if (!data || data.length === 0) {
      results.innerHTML = '<div style="padding:8px;color:var(--text-dim)">No results</div>';
      results.style.display = 'block';
      return;
    }
    // Sort: ports/harbours first
    data.sort(function(a, b) {
      var aPort = (a.type || '').match(/port|harbour|marina/) ? 0 : 1;
      var bPort = (b.type || '').match(/port|harbour|marina/) ? 0 : 1;
      return aPort - bPort;
    });

    results.innerHTML = data.map(function(item) {
      return '<div class="search-result-item" data-lat="' + item.lat + '" data-lon="' + item.lon + '">' +
        '<span style="font-weight:600">' + (item.display_name || '').split(',')[0] + '</span>' +
        '<span style="font-size:10px;color:var(--text-dim);display:block">' +
        (item.display_name || '').split(',').slice(1, 3).join(',') + '</span></div>';
    }).join('');
    results.style.display = 'block';

    // Click handlers
    results.querySelectorAll('.search-result-item').forEach(function(el) {
      el.addEventListener('mousedown', function() {
        var lat = parseFloat(el.getAttribute('data-lat'));
        var lon = parseFloat(el.getAttribute('data-lon'));
        STATE.map.setView([lat, lon], 13);
        results.style.display = 'none';
        document.getElementById('chartSearchInput').value = '';
      });
    });
  }).catch(function() {});
}

/* ============================================================
   HOME BUTTON — Fly back to ship position
   ============================================================ */
function chartGoHome() {
  if (!STATE.map) return;
  var lat = STATE.manualMode && STATE.manualLat != null ? STATE.manualLat : STATE.lat;
  var lon = STATE.manualMode && STATE.manualLon != null ? STATE.manualLon : STATE.lon;
  if (lat != null && lon != null) {
    STATE.map.flyTo([lat, lon], 14, { duration: 1 });
  }
}

/* ============================================================
   DEPTH ZOOM — Auto-zoom to best scale for viewing depth data
   ============================================================ */
function chartDepthZoom() {
  if (!STATE.map) return;
  var lat = STATE.manualMode && STATE.manualLat != null ? STATE.manualLat : STATE.lat;
  var lon = STATE.manualMode && STATE.manualLon != null ? STATE.manualLon : STATE.lon;
  if (lat != null && lon != null) {
    // Zoom level 11-12 is optimal for GEBCO depth contour visibility
    STATE.map.flyTo([lat, lon], 11, { duration: 1 });
    // Ensure depth layer is on
    if (!STATE.map.hasLayer(STATE.depthLayer)) {
      STATE.depthLayer.addTo(STATE.map);
      saveSetting('depthLayer', true);
      document.getElementById('toggleDepth').classList.add('on');
    }
  }
}

/* ============================================================
   UKC (Under Keel Clearance) CALCULATOR
   ============================================================ */
var chartDepthAtCursor = null;

function updateUKC() {
  var draft = parseFloat(document.getElementById('vesselDraft').value);
  var ukcEl = document.getElementById('ukcDisplay');
  var warnEl = document.getElementById('ukcWarning');
  if (isNaN(draft) || draft <= 0 || chartDepthAtCursor == null) {
    ukcEl.textContent = '--';
    ukcEl.style.color = '';
    warnEl.style.display = 'none';
    return;
  }
  var ukc = chartDepthAtCursor - draft;
  ukcEl.textContent = ukc.toFixed(1);
  if (ukc < 2) {
    ukcEl.style.color = 'var(--danger)';
    warnEl.style.display = 'block';
  } else if (ukc < 5) {
    ukcEl.style.color = 'var(--warning)';
    warnEl.style.display = 'none';
  } else {
    ukcEl.style.color = 'var(--accent)';
    warnEl.style.display = 'none';
  }
}

/* ============================================================
   LOAD NEARBY PORTS (Overpass API) — Highlighted clickable markers
   ============================================================ */
var portMarkers = [];

var activePortMarkerEl = null; // Track the currently active (clicked) port marker

function loadNearbyPorts() {
  if (!STATE.map) return;
  var center = STATE.map.getCenter();
  var bounds = STATE.map.getBounds();
  var bbox = bounds.getSouth().toFixed(4) + ',' + bounds.getWest().toFixed(4) + ',' +
             bounds.getNorth().toFixed(4) + ',' + bounds.getEast().toFixed(4);

  var query = '[out:json][timeout:15];(' +
    'node["seamark:type"~"harbour|anchorage|mooring|radio_station|pilot_boarding"](' + bbox + ');' +
    'node["harbour"](' + bbox + ');' +
    'node["leisure"="marina"](' + bbox + ');' +
    ');out body 50;';

  var url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

  // Clear old markers
  portMarkers.forEach(function(m) { STATE.map.removeLayer(m); });
  portMarkers = [];

  // Show loading indicator on the PORTS button
  var portsBtn = document.querySelector('[onclick="loadNearbyPorts()"]');
  if (portsBtn) {
    portsBtn.classList.add('port-loading');
    portsBtn.innerHTML = '<div class="port-loading-spinner"></div><span style="font-size:7px;color:#ff8a65;margin-top:-2px">LOADING</span>';
  }

  fetch(url, { headers: { 'Accept-Language': 'en' } }).then(function(r) { return r.json(); }).then(function(data) {
    // Restore button
    if (portsBtn) {
      portsBtn.classList.remove('port-loading');
      portsBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff8a65" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 7 8 11.7z"/></svg><span style="font-size:7px;color:#ff8a65;margin-top:-2px">PORTS</span>';
    }

    if (!data.elements || data.elements.length === 0) return;

    data.elements.forEach(function(el) {
      if (!el.lat || !el.lon) return;
      var tags = el.tags || {};
      // Prefer English name
      var name = tags['name:en'] || tags['int_name'] || tags.name || tags['seamark:name'] || tags['harbour:name'] || 'Unknown';

      // Create highlighted label marker
      var icon = L.divIcon({
        className: '',
        html: '<div class="port-marker-label">' + name + '</div>',
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      var marker = L.marker([el.lat, el.lon], { icon: icon }).addTo(STATE.map);
      marker.on('click', function() {
        // Bold the active marker
        if (activePortMarkerEl) activePortMarkerEl.classList.remove('port-marker-active');
        var markerEl = marker.getElement();
        if (markerEl) {
          var labelEl = markerEl.querySelector('.port-marker-label');
          if (labelEl) { labelEl.classList.add('port-marker-active'); activePortMarkerEl = labelEl; }
        }
        showPortPopup(el.lat, el.lon, tags, name);
      });
      portMarkers.push(marker);
    });
  }).catch(function() {
    if (portsBtn) {
      portsBtn.classList.remove('port-loading');
      portsBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff8a65" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 7 8 11.7z"/></svg><span style="font-size:7px;color:#ff8a65;margin-top:-2px">PORTS</span>';
    }
  });
}

function showPortPopup(lat, lon, tags, name) {
  var html = buildPortDetailHtml(name, lat, lon, tags);
  L.popup({ maxWidth: 320 })
    .setLatLng([lat, lon])
    .setContent(html)
    .openOn(STATE.map);
}
