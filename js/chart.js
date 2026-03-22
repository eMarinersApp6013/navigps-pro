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

  // GEBCO Bathymetry depth layer
  STATE.depthLayer = L.tileLayer.wms('https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv', {
    layers: 'GEBCO_LATEST',
    format: 'image/png',
    transparent: true,
    opacity: 0.35,
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
    'node["seamark:type"~"harbour|anchorage|mooring"](' + bbox + ');' +
    'node["harbour"](' + bbox + ');' +
    'node["leisure"="marina"](' + bbox + ');' +
    'way["seamark:type"~"harbour|anchorage"](' + bbox + ');' +
    ');out body;';

  var url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

  fetch(url).then(function(r) { return r.json(); }).then(function(data) {
    if (!data.elements || data.elements.length === 0) return;
    var el = data.elements[0];
    var tags = el.tags || {};
    var name = tags.name || tags['seamark:name'] || tags['harbour:name'] || 'Unknown Port';
    var plat = el.lat || lat;
    var plon = el.lon || lon;

    var html = '<b style="font-size:14px">' + name + '</b><br>';
    html += '<span style="font-size:11px;color:#888">' + plat.toFixed(4) + ', ' + plon.toFixed(4) + '</span><br>';

    if (tags['seamark:harbour:category']) html += '<b>Type:</b> ' + tags['seamark:harbour:category'] + '<br>';
    if (tags.vhf || tags['seamark:radio_station:channel']) html += '<b>VHF Ch:</b> ' + (tags.vhf || tags['seamark:radio_station:channel']) + '<br>';
    if (tags['seamark:anchorage:category']) html += '<b>Anchorage:</b> ' + tags['seamark:anchorage:category'] + '<br>';
    if (tags['seamark:pilot_boarding:category']) html += '<b>Pilot:</b> ' + tags['seamark:pilot_boarding:category'] + '<br>';
    if (tags.description) html += '<b>Info:</b> ' + tags.description + '<br>';
    if (tags.website) html += '<a href="' + tags.website + '" target="_blank" style="color:#2a7fff">Website</a><br>';

    L.popup({ maxWidth: 280 })
      .setLatLng([plat, plon])
      .setContent(html)
      .openOn(STATE.map);
  }).catch(function() {});
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
