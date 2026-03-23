/**
 * Unit tests for position formatting functions
 * Tests: display.js (formatLat, formatLon)
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

require('../setup.js');
loadScript(JS_DIR + '/state.js');
loadScript(JS_DIR + '/display.js');

describe('formatLat()', function() {

  it('should format null as placeholder', function() {
    var result = formatLat(null, 'dm');
    assert.ok(result.includes('--'));
  });

  it('should format positive latitude as N', function() {
    var result = formatLat(22.5833, 'dm');
    assert.ok(result.includes('N'), 'Expected N hemisphere, got: ' + result);
    assert.ok(result.includes('22'), 'Expected degrees 22, got: ' + result);
  });

  it('should format negative latitude as S', function() {
    var result = formatLat(-33.8688, 'dm');
    assert.ok(result.includes('S'), 'Expected S hemisphere, got: ' + result);
    assert.ok(result.includes('33'), 'Expected degrees 33, got: ' + result);
  });

  it('should format in decimal degrees mode', function() {
    var result = formatLat(22.57667, 'dd');
    assert.ok(result.includes('22.57667'), 'Expected decimal degrees, got: ' + result);
    assert.ok(result.includes('N'));
  });

  it('should format in degrees-minutes mode', function() {
    var result = formatLat(22.57667, 'dm');
    assert.ok(result.includes('22'));
    assert.ok(result.includes('N'));
    // 0.57667 * 60 = 34.600 minutes
    assert.ok(result.includes('34'), 'Expected ~34 minutes, got: ' + result);
  });

  it('should format in DMS mode', function() {
    var result = formatLat(22.57667, 'dms');
    assert.ok(result.includes('22'));
    assert.ok(result.includes('N'));
    assert.ok(result.includes('"'), 'Expected seconds indicator, got: ' + result);
  });

  it('should handle equator (0 degrees)', function() {
    var result = formatLat(0, 'dm');
    assert.ok(result.includes('00'));
    assert.ok(result.includes('N'));
  });

  it('should handle extreme latitudes', function() {
    var north = formatLat(89.9999, 'dm');
    assert.ok(north.includes('89'));
    assert.ok(north.includes('N'));

    var south = formatLat(-89.9999, 'dm');
    assert.ok(south.includes('89'));
    assert.ok(south.includes('S'));
  });
});

describe('formatLon()', function() {

  it('should format null as placeholder', function() {
    var result = formatLon(null, 'dm');
    assert.ok(result.includes('---'));
  });

  it('should format positive longitude as E', function() {
    var result = formatLon(55.2056, 'dm');
    assert.ok(result.includes('E'), 'Expected E, got: ' + result);
    assert.ok(result.includes('055'), 'Expected 055 degrees, got: ' + result);
  });

  it('should format negative longitude as W', function() {
    var result = formatLon(-73.9857, 'dm');
    assert.ok(result.includes('W'), 'Expected W, got: ' + result);
    assert.ok(result.includes('073'), 'Expected 073 degrees, got: ' + result);
  });

  it('should zero-pad to 3 digits', function() {
    var result = formatLon(5.5, 'dm');
    assert.ok(result.includes('005'), 'Expected zero-padded 005, got: ' + result);
  });

  it('should handle prime meridian (0 degrees)', function() {
    var result = formatLon(0, 'dm');
    assert.ok(result.includes('000'));
    assert.ok(result.includes('E'));
  });

  it('should handle 180 degrees', function() {
    var result = formatLon(180, 'dm');
    assert.ok(result.includes('180'));
  });
});

describe('Position formatting — known maritime positions', function() {

  it('should correctly format Mumbai Anchorage (18°55.000\'N, 072°50.000\'E)', function() {
    var lat = formatLat(18.91667, 'dm');
    var lon = formatLon(72.83333, 'dm');
    assert.ok(lat.includes('18'));
    assert.ok(lat.includes('N'));
    assert.ok(lon.includes('072'));
    assert.ok(lon.includes('E'));
  });

  it('should correctly format Singapore Strait (01°16.000\'N, 103°50.000\'E)', function() {
    var lat = formatLat(1.26667, 'dm');
    var lon = formatLon(103.83333, 'dm');
    assert.ok(lat.includes('01'));
    assert.ok(lat.includes('N'));
    assert.ok(lon.includes('103'));
    assert.ok(lon.includes('E'));
  });

  it('should correctly format Suez Canal entrance (29°52.000\'N, 032°34.000\'E)', function() {
    var lat = formatLat(29.86667, 'dm');
    var lon = formatLon(32.56667, 'dm');
    assert.ok(lat.includes('29'));
    assert.ok(lat.includes('N'));
    assert.ok(lon.includes('032'));
    assert.ok(lon.includes('E'));
  });
});
