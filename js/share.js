/* ============================================================
   POSITION SHARING (PeerJS)
   ============================================================ */
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function startSending() {
  var code = generateCode();
  var peerId = 'navigps-' + code;

  document.getElementById('sendPanel').style.display = 'block';
  document.getElementById('shareCode').textContent = code;
  document.getElementById('sendStatus').textContent = 'Connecting to signaling server...';
  document.getElementById('btnSend').disabled = true;
  document.getElementById('receivePanel').style.display = 'none';

  try {
    STATE.peer = new Peer(peerId, { debug: 0 });

    STATE.peer.on('open', function() {
      document.getElementById('sendStatus').textContent = 'Ready! Share this code with the PC';
      STATE.isSharing = true;
    });

    STATE.peer.on('connection', function(conn) {
      STATE.conn = conn;
      document.getElementById('sendStatus').textContent = 'PC Connected \u2014 Streaming position...';
      document.getElementById('sendStatus').style.color = 'var(--accent)';

      conn.on('close', function() {
        document.getElementById('sendStatus').textContent = 'PC Disconnected';
        document.getElementById('sendStatus').style.color = 'var(--warning)';
      });
    });

    STATE.peer.on('error', function(err) {
      document.getElementById('sendStatus').textContent = 'Error: ' + err.type;
      document.getElementById('sendStatus').style.color = 'var(--danger)';
    });
  } catch(e) {
    document.getElementById('sendStatus').textContent = 'PeerJS Error \u2014 Check internet';
  }
}

function stopSharing() {
  STATE.isSharing = false;
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

  try {
    STATE.peer = new Peer({ debug: 0 });

    STATE.peer.on('open', function() {
      var conn = STATE.peer.connect(peerId, { reliable: true });
      STATE.conn = conn;

      conn.on('open', function() {
        document.getElementById('receiveStatus').textContent = 'Connected \u2014 Receiving data';
        document.getElementById('receiveStatus').style.color = 'var(--accent)';
        document.getElementById('receivedDataPanel').style.display = 'block';
        STATE.isReceiving = true;
      });

      conn.on('data', function(data) {
        try {
          var d = JSON.parse(data);
          if (d.type === 'pos') {
            var s = getSettings();
            document.getElementById('rxLat').textContent = formatLat(d.lat, s.posFormat);
            document.getElementById('rxLon').textContent = formatLon(d.lon, s.posFormat);
            document.getElementById('rxHdg').textContent = (d.hdg != null ? d.hdg.toFixed(1) + '\u00B0' : (d.cog != null ? d.cog.toFixed(1) + '\u00B0T' : '--'));
            var spdKn = d.spd != null ? (d.spd * 1.94384).toFixed(1) : '--';
            document.getElementById('rxSpd').textContent = spdKn + ' kn';
            document.getElementById('rxAcc').textContent = d.acc != null ? d.acc.toFixed(0) + 'm' : '--';
            document.getElementById('rxVar').textContent = d['var'] != null ? (d['var'] >= 0 ? d['var'].toFixed(1) + '\u00B0E' : Math.abs(d['var']).toFixed(1) + '\u00B0W') : '--';
            document.getElementById('rxTime').textContent = new Date(d.ts).toUTCString().slice(-12, -4);
          }
        } catch(e) {}
      });

      conn.on('close', function() {
        document.getElementById('receiveStatus').textContent = 'Disconnected';
        document.getElementById('receiveStatus').style.color = 'var(--warning)';
        STATE.isReceiving = false;
      });
    });

    STATE.peer.on('error', function(err) {
      document.getElementById('receiveStatus').textContent = 'Error: ' + err.type + ' \u2014 Check code';
      document.getElementById('receiveStatus').style.color = 'var(--danger)';
    });
  } catch(e) {
    document.getElementById('receiveStatus').textContent = 'Connection failed';
  }
}

function stopReceiving() {
  STATE.isReceiving = false;
  if (STATE.conn) STATE.conn.close();
  if (STATE.peer) STATE.peer.destroy();
  STATE.peer = null; STATE.conn = null;
  document.getElementById('receivePanel').style.display = 'none';
  document.getElementById('receivedDataPanel').style.display = 'none';
  document.getElementById('receiveStatus').style.color = '';
}
