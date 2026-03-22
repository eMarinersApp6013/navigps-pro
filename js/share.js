/* ============================================================
   POSITION SHARING (PeerJS) — Persistent code, auto-reconnect
   ============================================================ */

// Get or create a persistent device code (survives refresh)
function getDeviceCode() {
  var stored = localStorage.getItem('navigps_share_code');
  if (stored && stored.length === 6) return stored;
  var code = Math.floor(100000 + Math.random() * 900000).toString();
  localStorage.setItem('navigps_share_code', code);
  return code;
}

function startSending() {
  var code = getDeviceCode();
  var peerId = 'navigps-' + code;
  document.getElementById('sendPanel').style.display = 'block';
  document.getElementById('shareCode').textContent = code;
  document.getElementById('sendStatus').textContent = 'Connecting to signaling server...';
  document.getElementById('btnSend').disabled = true;
  document.getElementById('receivePanel').style.display = 'none';

  // Destroy any existing peer
  if (STATE.peer) {
    try { STATE.peer.destroy(); } catch(e) {}
    STATE.peer = null;
  }

  try {
    STATE.peer = new Peer(peerId, { debug: 0 });
    STATE.peer.on('open', function() {
      document.getElementById('sendStatus').textContent = 'Ready! Share this code with the PC. Code persists across refreshes.';
      STATE.isSharing = true;

      // Start continuous streaming interval
      startStreamingInterval();
    });
    STATE.peer.on('connection', function(conn) {
      STATE.conn = conn;
      document.getElementById('sendStatus').textContent = 'PC Connected — Streaming position continuously...';
      document.getElementById('sendStatus').style.color = 'var(--accent)';
      conn.on('close', function() {
        document.getElementById('sendStatus').textContent = 'PC Disconnected — Waiting for reconnect...';
        document.getElementById('sendStatus').style.color = 'var(--warning)';
        STATE.conn = null;
      });
      conn.on('error', function() {
        document.getElementById('sendStatus').textContent = 'Connection error — Waiting for reconnect...';
        document.getElementById('sendStatus').style.color = 'var(--warning)';
        STATE.conn = null;
      });
    });
    STATE.peer.on('error', function(err) {
      if (err.type === 'unavailable-id') {
        // ID already taken — destroy and retry with slight delay
        document.getElementById('sendStatus').textContent = 'Reconnecting...';
        setTimeout(function() {
          if (STATE.peer) { try { STATE.peer.destroy(); } catch(e) {} }
          STATE.peer = null;
          startSending();
        }, 2000);
        return;
      }
      document.getElementById('sendStatus').textContent = 'Error: ' + err.type;
      document.getElementById('sendStatus').style.color = 'var(--danger)';
    });
    STATE.peer.on('disconnected', function() {
      // Auto reconnect to signaling server
      if (STATE.isSharing && STATE.peer) {
        setTimeout(function() {
          if (STATE.peer && !STATE.peer.destroyed) {
            try { STATE.peer.reconnect(); } catch(e) {}
          }
        }, 3000);
      }
    });
  } catch(e) {
    document.getElementById('sendStatus').textContent = 'PeerJS Error — Check internet';
  }
}

// Continuous streaming interval — sends position every 2 seconds
var streamingTimer = null;

function startStreamingInterval() {
  if (streamingTimer) clearInterval(streamingTimer);
  streamingTimer = setInterval(function() {
    sendPositionData();
  }, 2000);
}

function sendPositionData() {
  if (!STATE.isSharing || !STATE.conn || !STATE.conn.open) return;
  if (STATE.lat == null) return;
  try {
    STATE.conn.send(JSON.stringify({
      type: 'pos',
      lat: STATE.lat,
      lon: STATE.lon,
      acc: STATE.accuracy,
      spd: STATE.sogMS,
      cog: STATE.cogGPS,
      hdg: STATE.compassHeading,
      'var': STATE.magVar,
      alt: STATE.alt,
      ts: Date.now()
    }));
  } catch(e) {}
}

function stopSharing() {
  STATE.isSharing = false;
  if (streamingTimer) { clearInterval(streamingTimer); streamingTimer = null; }
  if (STATE.conn) STATE.conn.close();
  if (STATE.peer) STATE.peer.destroy();
  STATE.peer = null; STATE.conn = null;
  document.getElementById('sendPanel').style.display = 'none';
  document.getElementById('btnSend').disabled = false;
  document.getElementById('sendStatus').style.color = '';
}

function startReceiving() {
  document.getElementById('receivePanel').style.display = 'block';
  document.getElementById('receivedDataPanel').style.display = 'none';
  document.getElementById('codeInput').value = '';
  document.getElementById('codeInput').focus();
}

function connectToSender() {
  var code = document.getElementById('codeInput').value.trim();
  if (code.length !== 6) {
    document.getElementById('receiveStatus').textContent = 'Enter exactly 6 digits';
    return;
  }

  var peerId = 'navigps-' + code;
  document.getElementById('receiveStatus').textContent = 'Connecting...';
  STATE.remoteCode = code;

  // Destroy any existing peer
  if (STATE.peer) {
    try { STATE.peer.destroy(); } catch(e) {}
    STATE.peer = null;
  }

  try {
    STATE.peer = new Peer({ debug: 0 });
    STATE.peer.on('open', function() {
      connectToPeer(peerId, code);
    });

    STATE.peer.on('error', function(err) {
      document.getElementById('receiveStatus').textContent = 'Error: ' + err.type + ' — Check code & internet';
      document.getElementById('receiveStatus').style.color = 'var(--danger)';

      // Auto-retry on peer-unavailable (sender might not be ready yet)
      if (err.type === 'peer-unavailable') {
        document.getElementById('receiveStatus').textContent = 'Sender not found — Retrying in 3s...';
        setTimeout(function() {
          if (STATE.peer && !STATE.peer.destroyed) {
            connectToPeer(peerId, code);
          }
        }, 3000);
      }
    });

    STATE.peer.on('disconnected', function() {
      if (STATE.isReceiving && STATE.peer) {
        setTimeout(function() {
          if (STATE.peer && !STATE.peer.destroyed) {
            try { STATE.peer.reconnect(); } catch(e) {}
          }
        }, 3000);
      }
    });
  } catch(e) {
    document.getElementById('receiveStatus').textContent = 'Connection failed';
  }
}

function connectToPeer(peerId, code) {
  if (!STATE.peer || STATE.peer.destroyed) return;
  var conn = STATE.peer.connect(peerId, { reliable: true });
  STATE.conn = conn;

  conn.on('open', function() {
    document.getElementById('receiveStatus').textContent = 'Connected — Receiving live data';
    document.getElementById('receiveStatus').style.color = 'var(--accent)';
    document.getElementById('receivedDataPanel').style.display = 'block';
    STATE.isReceiving = true;

    // Enter REMOTE mode — pause local GPS, drive all tabs from remote data
    STATE.remoteMode = true;
    document.getElementById('remoteBadge').classList.add('show');
    document.getElementById('remoteCodeLabel').textContent = code;
  });

  conn.on('data', function(data) {
    try {
      var d = JSON.parse(data);
      if (d.type === 'pos') {
        onRemotePositionData(d);
      }
    } catch(e) {}
  });

  conn.on('close', function() {
    document.getElementById('receiveStatus').textContent = 'Disconnected — Attempting reconnect...';
    document.getElementById('receiveStatus').style.color = 'var(--warning)';
    // Auto-reconnect after 3s
    setTimeout(function() {
      if (STATE.peer && !STATE.peer.destroyed && STATE.isReceiving) {
        connectToPeer(peerId, code);
      }
    }, 3000);
  });

  conn.on('error', function() {
    document.getElementById('receiveStatus').textContent = 'Connection error — Retrying...';
    document.getElementById('receiveStatus').style.color = 'var(--warning)';
  });
}

/* Update ALL data from remote position */
function onRemotePositionData(d) {
  var s = getSettings();

  // Update STATE with remote data — drives all tabs
  STATE.lat = d.lat;
  STATE.lon = d.lon;
  STATE.accuracy = d.acc;
  STATE.sogMS = d.spd;
  STATE.cogGPS = d.cog;
  STATE.compassHeading = d.hdg;
  STATE.magVar = d['var'];
  STATE.alt = d.alt;
  STATE.lastGpsTimestamp = Date.now();

  // Track trail from remote
  if (getSettings().trackTrail && STATE.lat) {
    STATE.trackPoints.push([STATE.lat, STATE.lon]);
    if (STATE.trackPoints.length > 500) STATE.trackPoints.shift();
  }

  // Update received data display panel
  document.getElementById('rxLat').textContent = formatLat(d.lat, s.posFormat);
  document.getElementById('rxLon').textContent = formatLon(d.lon, s.posFormat);
  document.getElementById('rxHdg').textContent = (d.hdg != null ? d.hdg.toFixed(1) + '\u00B0' : (d.cog != null ? d.cog.toFixed(1) + '\u00B0T' : '--'));
  var spdKn = d.spd != null ? (d.spd * 1.94384).toFixed(1) : '--';
  document.getElementById('rxSpd').textContent = spdKn + ' kn';
  document.getElementById('rxAcc').textContent = d.acc != null ? d.acc.toFixed(0) + 'm' : '--';
  document.getElementById('rxVar').textContent = d['var'] != null ? (d['var'] >= 0 ? d['var'].toFixed(1) + '\u00B0E' : Math.abs(d['var']).toFixed(1) + '\u00B0W') : '--';
  document.getElementById('rxTime').textContent = new Date(d.ts).toUTCString().slice(-12, -4);

  // Refresh ALL displays — NAV, CHART, SKYPLOT, CELESTIAL
  refreshAllDisplays();
}

function exitRemoteMode() {
  STATE.isReceiving = false;
  STATE.remoteMode = false;
  STATE.remoteCode = null;
  document.getElementById('remoteBadge').classList.remove('show');
  // Resume local GPS
}

function stopReceiving() {
  exitRemoteMode();
  if (STATE.conn) STATE.conn.close();
  if (STATE.peer) STATE.peer.destroy();
  STATE.peer = null; STATE.conn = null;
  document.getElementById('receivePanel').style.display = 'none';
  document.getElementById('receivedDataPanel').style.display = 'none';
  document.getElementById('receiveStatus').style.color = '';
}
