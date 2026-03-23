/**
 * Unit tests for STATE object and settings management
 * Tests: state.js
 */
const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');

// Set up browser globals
require('../setup.js');

// Load the module under test (into global scope, like a browser <script> tag)
loadScript(JS_DIR + '/state.js');

describe('STATE object', function() {

  it('should have all required navigation properties', function() {
    assert.ok('lat' in STATE, 'STATE.lat missing');
    assert.ok('lon' in STATE, 'STATE.lon missing');
    assert.ok('alt' in STATE, 'STATE.alt missing');
    assert.ok('accuracy' in STATE, 'STATE.accuracy missing');
    assert.ok('speed' in STATE, 'STATE.speed missing');
    assert.ok('heading' in STATE, 'STATE.heading missing');
    assert.ok('cogGPS' in STATE, 'STATE.cogGPS missing');
    assert.ok('compassHeading' in STATE, 'STATE.compassHeading missing');
    assert.ok('magVar' in STATE, 'STATE.magVar missing');
  });

  it('should have null defaults for position', function() {
    assert.strictEqual(STATE.lat, null);
    assert.strictEqual(STATE.lon, null);
    assert.strictEqual(STATE.alt, null);
  });

  it('should have GPS lost/freeze tracking', function() {
    assert.ok('gpsLost' in STATE, 'STATE.gpsLost missing');
    assert.ok('lastGpsTimestamp' in STATE, 'STATE.lastGpsTimestamp missing');
    assert.strictEqual(STATE.gpsLost, false);
  });

  it('should have manual mode fields', function() {
    assert.ok('manualMode' in STATE, 'STATE.manualMode missing');
    assert.ok('manualLat' in STATE, 'STATE.manualLat missing');
    assert.ok('manualLon' in STATE, 'STATE.manualLon missing');
    assert.strictEqual(STATE.manualMode, false);
  });

  it('should have anchor watch fields', function() {
    assert.ok('anchorPosition' in STATE);
    assert.ok('anchorRadius' in STATE);
    assert.ok('anchorAlarm' in STATE);
    assert.ok('anchorWatchActive' in STATE);
    assert.strictEqual(STATE.anchorRadius, 100);
  });

  it('should have MOB fields', function() {
    assert.ok('mobPosition' in STATE);
    assert.strictEqual(STATE.mobPosition, null);
  });

  it('should have remote/sharing fields', function() {
    assert.ok('isSharing' in STATE);
    assert.ok('isReceiving' in STATE);
    assert.ok('remoteMode' in STATE);
  });
});

describe('getSettings()', function() {

  beforeEach(function() {
    resetTestStorage();
  });

  it('should return defaults when no saved settings', function() {
    var s = getSettings();
    assert.strictEqual(s.nightMode, false);
    assert.strictEqual(s.wakeLock, true);
    assert.strictEqual(s.posFormat, 'dm');
    assert.strictEqual(s.accThreshold, '50');
    assert.strictEqual(s.seamarks, true);
    assert.strictEqual(s.trackTrail, true);
    assert.strictEqual(s.depthLayer, true);
  });

  it('should merge saved settings with defaults', function() {
    localStorage.setItem('navigps_settings', JSON.stringify({ nightMode: true }));
    var s = getSettings();
    assert.strictEqual(s.nightMode, true);
    assert.strictEqual(s.wakeLock, true);  // default preserved
    assert.strictEqual(s.posFormat, 'dm'); // default preserved
  });

  it('should handle corrupted localStorage gracefully', function() {
    localStorage.setItem('navigps_settings', 'not valid json{{{');
    var s = getSettings();
    assert.strictEqual(s.nightMode, false); // falls back to defaults
    assert.strictEqual(s.wakeLock, true);
  });
});

describe('saveSetting()', function() {

  beforeEach(function() {
    resetTestStorage();
  });

  it('should save a single setting', function() {
    saveSetting('nightMode', true);
    var s = getSettings();
    assert.strictEqual(s.nightMode, true);
  });

  it('should preserve other settings when saving one', function() {
    saveSetting('nightMode', true);
    saveSetting('posFormat', 'dms');
    var s = getSettings();
    assert.strictEqual(s.nightMode, true);
    assert.strictEqual(s.posFormat, 'dms');
  });

  it('should persist to localStorage', function() {
    saveSetting('heightOfEye', '25');
    var raw = JSON.parse(localStorage.getItem('navigps_settings'));
    assert.strictEqual(raw.heightOfEye, '25');
  });
});
