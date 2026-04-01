/* ============================================================
   BEARING & DISTANCE CALCULATOR
   ============================================================ */
function useCurrentAsPointA() {
  if (STATE.lat == null) return;
  var s = getSettings();
  document.getElementById('brgLatA').value = Math.abs(STATE.lat).toFixed(5);
  document.getElementById('brgLatADir').value = STATE.lat >= 0 ? 'N' : 'S';
  document.getElementById('brgLonA').value = Math.abs(STATE.lon).toFixed(5);
  document.getElementById('brgLonADir').value = STATE.lon >= 0 ? 'E' : 'W';
}

function calcBearingDistance() {
  var latA = parseFloat(document.getElementById('brgLatA').value);
  var lonA = parseFloat(document.getElementById('brgLonA').value);
  var latB = parseFloat(document.getElementById('brgLatB').value);
  var lonB = parseFloat(document.getElementById('brgLonB').value);
  if (isNaN(latA) || isNaN(lonA) || isNaN(latB) || isNaN(lonB)) {
    document.getElementById('brgResult').innerHTML = '<span style="color:var(--warning)">Enter valid coordinates</span>';
    return;
  }
  if (document.getElementById('brgLatADir').value === 'S') latA = -latA;
  if (document.getElementById('brgLonADir').value === 'W') lonA = -lonA;
  if (document.getElementById('brgLatBDir').value === 'S') latB = -latB;
  if (document.getElementById('brgLonBDir').value === 'W') lonB = -lonB;

  // Great circle
  var dist = haversineDistance(latA, lonA, latB, lonB);
  var distNM = dist / 1852;
  var initBrg = haversineBearing(latA, lonA, latB, lonB);
  var finalBrg = (haversineBearing(latB, lonB, latA, lonA) + 180) % 360;

  // Rhumb line
  var dLat = (latB - latA) * Math.PI / 180;
  var dLon = (lonB - lonA) * Math.PI / 180;
  var latAR = latA * Math.PI / 180, latBR = latB * Math.PI / 180;
  var dPhi = Math.log(Math.tan(Math.PI/4 + latBR/2) / Math.tan(Math.PI/4 + latAR/2));
  var q = Math.abs(dPhi) > 1e-12 ? dLat / dPhi : Math.cos(latAR);
  if (Math.abs(dLon) > Math.PI) dLon = dLon > 0 ? -(2*Math.PI - dLon) : (2*Math.PI + dLon);
  var rhumbDist = Math.sqrt(dLat*dLat + q*q*dLon*dLon) * 6371000;
  var rhumbNM = rhumbDist / 1852;
  var rhumbBrg = (Math.atan2(dLon, dPhi) * 180 / Math.PI + 360) % 360;

  document.getElementById('brgResult').innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
    '<div><div class="data-label">Great Circle Dist</div><div class="data-medium mono" style="color:var(--accent)">' + distNM.toFixed(2) + ' NM</div><div class="data-small">(' + (dist/1000).toFixed(2) + ' km)</div></div>' +
    '<div><div class="data-label">Rhumb Line Dist</div><div class="data-medium mono" style="color:var(--info)">' + rhumbNM.toFixed(2) + ' NM</div><div class="data-small">(' + (rhumbDist/1000).toFixed(2) + ' km)</div></div>' +
    '<div><div class="data-label">Initial Bearing</div><div class="data-medium mono hdg-value">' + initBrg.toFixed(1) + '\u00B0T</div></div>' +
    '<div><div class="data-label">Rhumb Bearing</div><div class="data-medium mono" style="color:var(--info)">' + rhumbBrg.toFixed(1) + '\u00B0T</div></div>' +
    '<div><div class="data-label">Final Bearing</div><div class="data-medium mono">' + finalBrg.toFixed(1) + '\u00B0T</div></div>' +
    '</div>';
}

/* Quick mode: click two points on chart */
var chartBrgPoints = [];
function enableChartBearing() {
  // Auto-switch to chart tab
  switchTab('chart', document.querySelectorAll('.nav-btn')[1]);

  // Wait for chart to initialize
  setTimeout(function() {
    if (!STATE.map) { alert('Chart not available'); return; }
    chartBrgPoints = [];
    document.getElementById('brgChartStatus').textContent = 'Tap Point A on chart...';
    STATE.map.once('click', function(e) {
      chartBrgPoints.push(e.latlng);
      document.getElementById('brgChartStatus').textContent = 'Tap Point B on chart...';
      STATE.map.once('click', function(e2) {
        chartBrgPoints.push(e2.latlng);
        // Fill in bearing calculator fields
        document.getElementById('brgLatA').value = Math.abs(chartBrgPoints[0].lat).toFixed(5);
        document.getElementById('brgLatADir').value = chartBrgPoints[0].lat >= 0 ? 'N' : 'S';
        document.getElementById('brgLonA').value = Math.abs(chartBrgPoints[0].lng).toFixed(5);
        document.getElementById('brgLonADir').value = chartBrgPoints[0].lng >= 0 ? 'E' : 'W';
        document.getElementById('brgLatB').value = Math.abs(chartBrgPoints[1].lat).toFixed(5);
        document.getElementById('brgLatBDir').value = chartBrgPoints[1].lat >= 0 ? 'N' : 'S';
        document.getElementById('brgLonB').value = Math.abs(chartBrgPoints[1].lng).toFixed(5);
        document.getElementById('brgLonBDir').value = chartBrgPoints[1].lng >= 0 ? 'E' : 'W';
        // Draw line on chart
        L.polyline([chartBrgPoints[0], chartBrgPoints[1]], { color: '#ffab00', weight: 2, dashArray: '6,4' }).addTo(STATE.map);
        // Calculate and show result
        var dist = haversineDistance(chartBrgPoints[0].lat, chartBrgPoints[0].lng, chartBrgPoints[1].lat, chartBrgPoints[1].lng);
        var brg = haversineBearing(chartBrgPoints[0].lat, chartBrgPoints[0].lng, chartBrgPoints[1].lat, chartBrgPoints[1].lng);
        document.getElementById('brgChartStatus').textContent = 'Dist: ' + (dist/1852).toFixed(2) + ' NM | Brg: ' + brg.toFixed(1) + '\u00B0T';
        // Switch back to NAV tab and auto-calculate
        setTimeout(function() {
          switchTab('nav', document.querySelectorAll('.nav-btn')[0]);
          calcBearingDistance();
        }, 1500);
      });
    });
  }, 500);
}
