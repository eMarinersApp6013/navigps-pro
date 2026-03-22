/* ============================================================
   MAP (Leaflet + OpenSeaMap)
   ============================================================ */
var mapCentered = false;

function initMap() {
  STATE.map = L.map('chart-map', {
    center: [25.0, 55.0], zoom: 8,
    zoomControl: true, attributionControl: true
  });

  var baseEnglish = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    subdomains: 'abcd'
  });
  baseEnglish.addTo(STATE.map);

  STATE.seamarkLayer = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
    maxZoom: 18, opacity: 0.9,
    attribution: '&copy; <a href="https://www.openseamap.org">OpenSeaMap</a>'
  });
  if (getSettings().seamarks) STATE.seamarkLayer.addTo(STATE.map);

  STATE.depthLayer = L.tileLayer.wms('https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv', {
    layers: 'GEBCO_LATEST',
    format: 'image/png',
    transparent: true,
    opacity: 0.35,
    attribution: '&copy; <a href="https://www.gebco.net">GEBCO</a>'
  });
  STATE.depthLayer.addTo(STATE.map);

  STATE.portLayer = L.tileLayer('https://tiles.openseamap.org/harbours/{z}/{x}/{y}.png', {
    maxZoom: 18, opacity: 1.0
  });
  STATE.portLayer.addTo(STATE.map);

  document.getElementById('chart-legend').style.display = 'block';

  var vesselIcon = L.divIcon({
    className: '',
    html: '<svg width="24" height="24" viewBox="0 0 24 24" style="filter:drop-shadow(0 0 4px rgba(0,230,118,.6))"><polygon points="12,2 6,20 12,16 18,20" fill="#00e676" stroke="#000" stroke-width="1"/></svg>',
    iconSize: [24, 24], iconAnchor: [12, 12]
  });
  STATE.marker = L.marker([25.0, 55.0], { icon: vesselIcon, rotationAngle: 0 }).addTo(STATE.map);

  STATE.trackLine = L.polyline([], { color: '#00e67688', weight: 2 }).addTo(STATE.map);
  STATE.accCircle = L.circle([25.0, 55.0], { radius: 50, color: '#2a7fff44', fillColor: '#2a7fff22', weight: 1 }).addTo(STATE.map);
}

function updateChartLayers() {
  if (!STATE.map) return;
  var s = getSettings();
  if (s.seamarks && !STATE.map.hasLayer(STATE.seamarkLayer)) {
    STATE.seamarkLayer.addTo(STATE.map);
  } else if (!s.seamarks && STATE.map.hasLayer(STATE.seamarkLayer)) {
    STATE.map.removeLayer(STATE.seamarkLayer);
  }
}

function updateMap() {
  if (!STATE.map || STATE.lat == null) return;

  // Use manual position if in manual mode
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

  if (getSettings().trackTrail) {
    STATE.trackLine.setLatLngs(STATE.trackPoints);
  }

  if (!mapCentered) {
    STATE.map.setView(pos, 14);
    mapCentered = true;
  }
}
