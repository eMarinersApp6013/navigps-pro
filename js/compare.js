/* ============================================================
   POSITION COMPARE (Auto-format: type 22345 -> 22 34.5')
   ============================================================ */
function autoFormatCoord(input, type) {
  var raw = input.value.replace(/[^0-9.]/g, '');
  input.value = raw;

  var parsed = parseRawCoord(raw, type);
  var formatEl = document.getElementById(type === 'lat' ? 'shipLatFormatted' : 'shipLonFormatted');

  if (parsed !== null) {
    var deg = Math.floor(parsed);
    var min = (parsed - deg) * 60;
    if (type === 'lat') {
      formatEl.textContent = deg.toString().padStart(2, '0') + '\u00B0' + min.toFixed(3).padStart(6, '0') + "'";
    } else {
      formatEl.textContent = deg.toString().padStart(3, '0') + '\u00B0' + min.toFixed(3).padStart(6, '0') + "'";
    }
    formatEl.style.color = 'var(--accent)';
  } else {
    formatEl.textContent = type === 'lat' ? "--\u00B0--.---'" : "---\u00B0--.---'";
    formatEl.style.color = 'var(--text-dim)';
  }
}

function parseRawCoord(raw, type) {
  if (!raw || raw.length < 3) return null;

  if (raw.includes('.')) {
    var parts = raw.split('.');
    var intPart = parts[0];
    var decPart = parts[1] || '';

    var degDigits = type === 'lat' ? 2 : 3;
    if (intPart.length < degDigits + 1) return null;

    var deg = parseInt(intPart.substring(0, degDigits));
    var minStr = intPart.substring(degDigits) + '.' + decPart;
    var min = parseFloat(minStr);

    if (isNaN(deg) || isNaN(min) || min >= 60) return null;
    if (type === 'lat' && deg > 90) return null;
    if (type === 'lon' && deg > 180) return null;

    return deg + min / 60;
  }

  var degDigits = type === 'lat' ? 2 : 3;
  if (raw.length < degDigits + 1) return null;

  var deg = parseInt(raw.substring(0, degDigits));
  var minDigits = raw.substring(degDigits);

  var min;
  if (minDigits.length <= 2) {
    min = parseInt(minDigits);
  } else {
    var wholeMin = minDigits.substring(0, 2);
    var decMin = minDigits.substring(2);
    min = parseFloat(wholeMin + '.' + decMin);
  }

  if (isNaN(deg) || isNaN(min) || min >= 60) return null;
  if (type === 'lat' && deg > 90) return null;
  if (type === 'lon' && deg > 180) return null;

  return deg + min / 60;
}

function comparePositions() {
  var latRaw = document.getElementById('shipLatRaw').value.replace(/[^0-9.]/g, '');
  var lonRaw = document.getElementById('shipLonRaw').value.replace(/[^0-9.]/g, '');
  var latDir = document.getElementById('shipLatNS').value;
  var lonDir = document.getElementById('shipLonEW').value;

  var shipLat = parseRawCoord(latRaw, 'lat');
  var shipLon = parseRawCoord(lonRaw, 'lon');

  if (shipLat == null || shipLon == null || STATE.lat == null) {
    document.getElementById('compareDiff').style.display = 'block';
    document.getElementById('compareDiff').textContent = 'Enter valid ship position and wait for GPS fix';
    document.getElementById('compareDiff').className = 'compare-diff warn';
    return;
  }

  if (latDir === 'S') shipLat = -shipLat;
  if (lonDir === 'W') shipLon = -shipLon;

  var R = 6371000;
  var dLat = (STATE.lat - shipLat) * Math.PI / 180;
  var dLon = (STATE.lon - shipLon) * Math.PI / 180;
  var a = Math.pow(Math.sin(dLat/2), 2) + Math.cos(shipLat*Math.PI/180) * Math.cos(STATE.lat*Math.PI/180) * Math.pow(Math.sin(dLon/2), 2);
  var dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  var distNM = dist / 1852;
  var el = document.getElementById('compareDiff');
  el.style.display = 'block';

  if (dist < 100) {
    el.className = 'compare-diff ok';
    el.textContent = 'Difference: ' + dist.toFixed(0) + 'm (' + distNM.toFixed(2) + ' NM) \u2014 Positions agree';
  } else if (dist < 500) {
    el.className = 'compare-diff warn';
    el.textContent = 'Difference: ' + dist.toFixed(0) + 'm (' + distNM.toFixed(2) + ' NM) \u2014 Minor discrepancy';
  } else {
    el.className = 'compare-diff danger';
    el.textContent = '\u26A0 Difference: ' + dist.toFixed(0) + 'm (' + distNM.toFixed(2) + ' NM) \u2014 POSSIBLE GPS SPOOFING / ERROR';
  }
}
