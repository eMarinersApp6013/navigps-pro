/* Magnetic Variation - WMM2025 (degree 6) */
function calcMagVar(lat, lon, dateDecimal) {
  var DEG = Math.PI / 180;
  var latR = lat * DEG;
  var lonR = lon * DEG;
  var t = dateDecimal - 2025.0;

  var C = [
    [1,0,-29351.8,0,12.0,0],
    [1,1,-2556.6,5029.4,10.1,-20.0],
    [2,0,-1492.3,0,-0.2,0],
    [2,1,3135.9,-2858.6,-1.1,-27.8],
    [2,2,1694.4,-638.8,2.3,-15.6],
    [3,0,1360.9,0,4.1,0],
    [3,1,-2063.2,-157.5,-1.4,7.0],
    [3,2,1377.2,237.2,0.3,-3.5],
    [3,3,525.9,-549.7,-6.4,-4.5],
    [4,0,903.0,0,-1.4,0],
    [4,1,814.8,283.3,0.2,1.8],
    [4,2,117.8,-188.6,-1.0,2.4],
    [4,3,-335.0,180.9,2.0,4.1],
    [4,4,69.7,-330.0,-1.8,-2.8],
    [5,0,-233.3,0,0.5,0],
    [5,1,357.2,47.7,-0.7,0.3],
    [5,2,191.7,-140.9,-0.3,1.2],
    [5,3,-141.0,-118.1,1.2,0.0],
    [5,4,-157.3,-78.0,0.8,0.4],
    [5,5,12.9,100.2,-0.3,1.2],
    [6,0,66.0,0,-0.3,0],
    [6,1,64.6,-20.1,0.3,-0.1],
    [6,2,76.2,44.2,-0.4,-0.1],
    [6,3,-63.2,64.6,0.5,-0.5],
    [6,4,-8.1,-108.7,0.2,-0.3],
    [6,5,2.2,-23.2,-0.3,0.3],
    [6,6,-11.4,-13.1,0.1,0.0]
  ];

  var NMAX = 6;
  var sinLat = Math.sin(latR);
  var cosLat = Math.cos(latR);
  if (Math.abs(cosLat) < 1e-10) cosLat = (cosLat < 0 ? -1 : 1) * 1e-10;

  var P = [], dP = [];
  for (var i = 0; i <= NMAX; i++) { P[i] = []; dP[i] = []; }

  P[0][0] = 1.0;
  dP[0][0] = 0.0;

  for (var n = 1; n <= NMAX; n++) {
    // Diagonal: P(n,n)
    P[n][n] = Math.sqrt((2*n - 1) / (2*n)) * cosLat * P[n-1][n-1];
    dP[n][n] = Math.sqrt((2*n - 1) / (2*n)) * (-sinLat * P[n-1][n-1] + cosLat * dP[n-1][n-1]);

    // Sub-diagonal: P(n,n-1)
    P[n][n-1] = Math.sqrt(2*n - 1) * sinLat * P[n-1][n-1];
    dP[n][n-1] = Math.sqrt(2*n - 1) * (cosLat * P[n-1][n-1] + sinLat * dP[n-1][n-1]);

    for (var m = 0; m <= n - 2; m++) {
      var Knm = ((n - 1) * (n - 1) - m * m) / ((2*n - 1) * (2*n - 3));
      var a1 = 1.0 / Math.sqrt(1 - Knm);
      var a2 = Math.sqrt(Knm / (1 - Knm));
      P[n][m] = a1 * sinLat * P[n-1][m] - a2 * P[n-2][m];
      dP[n][m] = a1 * (cosLat * P[n-1][m] + sinLat * dP[n-1][m]) - a2 * dP[n-2][m];
    }
  }

  var X = 0, Y = 0;

  for (var ci = 0; ci < C.length; ci++) {
    var c = C[ci];
    var n = c[0], m = c[1];
    var g = c[2] + c[4] * t;
    var h = c[3] + c[5] * t;
    var cosML = Math.cos(m * lonR);
    var sinML = Math.sin(m * lonR);

    X += -(g * cosML + h * sinML) * dP[n][m];
    Y += m * (g * sinML - h * cosML) * P[n][m] / cosLat;
  }

  return Math.atan2(Y, X) / DEG;
}

function getDecimalYear() {
  var now = new Date();
  var start = new Date(now.getFullYear(), 0, 1);
  var end = new Date(now.getFullYear() + 1, 0, 1);
  return now.getFullYear() + (now - start) / (end - start);
}
