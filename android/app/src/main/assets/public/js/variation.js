/* ============================================================
   MAGNETIC VARIATION (WMM2025 simplified)
   ============================================================ */
function calcMagVar(lat, lon, dateDecimal) {
  var DEG = Math.PI / 180;
  var latR = lat * DEG;
  var lonR = lon * DEG;
  var t = dateDecimal - 2025.0;
  var coeffs = [
    [1,0,-29351.8,0,12.0,0],
    [1,1,-2556.6,5029.4,10.1,-20.0],
    [2,0,-1492.3,0,-0.2,0],
    [2,1,3135.9,-2858.6,-1.1,-27.8],
    [2,2,1694.4,-638.8,2.3,-15.6],
    [3,0,1360.9,0,4.1,0],
    [3,1,-2063.2,-157.5,-1.4,7.0],
    [3,2,1377.2,237.2,0.3,-3.5],
    [3,3,525.9,-549.7,-6.4,-4.5],
  ];

  var a = 6371.2;
  var X = 0, Y = 0;

  var sinLat = Math.sin(latR);
  var cosLat = Math.cos(latR);

  for (var ci = 0; ci < coeffs.length; ci++) {
    var c = coeffs[ci];
    var n = c[0], m = c[1], gnm = c[2], hnm = c[3], gDot = c[4], hDot = c[5];
    var g = gnm + gDot * t;
    var h = hnm + hDot * t;
    var ratio = Math.pow(a / 6371.2, n + 2);

    var Pnm, dPnm;
    if (n === 1 && m === 0) {
      Pnm = sinLat; dPnm = cosLat;
    } else if (n === 1 && m === 1) {
      Pnm = cosLat; dPnm = -sinLat;
    } else if (n === 2 && m === 0) {
      Pnm = 0.5 * (3 * sinLat * sinLat - 1); dPnm = 3 * sinLat * cosLat;
    } else if (n === 2 && m === 1) {
      Pnm = Math.sqrt(3) * sinLat * cosLat;
      dPnm = Math.sqrt(3) * (cosLat * cosLat - sinLat * sinLat);
    } else if (n === 2 && m === 2) {
      Pnm = Math.sqrt(3) * cosLat * cosLat;
      dPnm = -2 * Math.sqrt(3) * sinLat * cosLat;
    } else if (n === 3 && m === 0) {
      Pnm = 0.5 * sinLat * (5 * sinLat * sinLat - 3);
      dPnm = 0.5 * (15 * sinLat * sinLat * cosLat - 3 * cosLat);
    } else if (n === 3 && m === 1) {
      var f1 = Math.sqrt(6) / 2;
      Pnm = f1 * cosLat * (5 * sinLat * sinLat - 1);
      dPnm = f1 * (-sinLat * (5 * sinLat * sinLat - 1) + 10 * sinLat * cosLat * cosLat);
    } else if (n === 3 && m === 2) {
      var f2 = Math.sqrt(15);
      Pnm = f2 * cosLat * cosLat * sinLat;
      dPnm = f2 * (cosLat * cosLat * cosLat - 2 * sinLat * sinLat * cosLat);
    } else if (n === 3 && m === 3) {
      var f3 = Math.sqrt(10);
      Pnm = f3 * cosLat * cosLat * cosLat;
      dPnm = -3 * f3 * sinLat * cosLat * cosLat;
    } else continue;

    var cosML = Math.cos(m * lonR);
    var sinML = Math.sin(m * lonR);

    X += -ratio * (g * cosML + h * sinML) * dPnm;
    Y += ratio * m * (g * sinML - h * cosML) * Pnm / (cosLat || 1e-10);
  }

  var decl = Math.atan2(Y, X) / DEG;
  return decl;
}

function getDecimalYear() {
  var now = new Date();
  var start = new Date(now.getFullYear(), 0, 1);
  var end = new Date(now.getFullYear() + 1, 0, 1);
  return now.getFullYear() + (now - start) / (end - start);
}
