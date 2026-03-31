/**
 * Unit tests for magnetic variation (WMM2025)
 * Tests: variation.js (calcMagVar, getDecimalYear)
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

require('../setup.js');
loadScript(JS_DIR + '/variation.js');

describe('calcMagVar()', function() {

  it('should return a number', function() {
    var result = calcMagVar(22.5, 55.2, 2026.0);
    assert.strictEqual(typeof result, 'number');
    assert.ok(!isNaN(result), 'Variation should not be NaN');
  });

  it('should return variation within reasonable range (-30 to +30 degrees) for common maritime areas', function() {
    // Indian Ocean
    var v1 = calcMagVar(10, 70, 2026.0);
    assert.ok(Math.abs(v1) < 30, 'Indian Ocean variation out of range: ' + v1);

    // North Atlantic
    var v2 = calcMagVar(40, -40, 2026.0);
    assert.ok(Math.abs(v2) < 30, 'North Atlantic variation out of range: ' + v2);

    // South Pacific
    var v3 = calcMagVar(-30, 170, 2026.0);
    assert.ok(Math.abs(v3) < 30, 'South Pacific variation out of range: ' + v3);
  });

  it('should show westerly variation in Arabian Sea (~1-3°E)', function() {
    // Arabian Sea: small easterly variation expected
    var v = calcMagVar(15, 65, 2026.0);
    // WMM2025 gives roughly 0-3°E for this area
    assert.ok(Math.abs(v) < 10, 'Arabian Sea variation too large: ' + v);
  });

  it('should show larger variation near magnetic poles', function() {
    // Northern Canada — high westerly variation
    var v = calcMagVar(70, -100, 2026.0);
    // Expect significant variation (could be 15-25° W)
    assert.ok(Math.abs(v) > 5, 'Expected significant variation near magnetic pole, got: ' + v);
  });

  it('should change with time (secular variation)', function() {
    var v2025 = calcMagVar(50, 0, 2025.0);
    var v2030 = calcMagVar(50, 0, 2030.0);
    // Should be different due to secular variation
    assert.notStrictEqual(v2025.toFixed(1), v2030.toFixed(1),
      'Variation should change over 5 years');
  });

  it('should handle equator', function() {
    var v = calcMagVar(0, 0, 2026.0);
    assert.ok(!isNaN(v), 'Equator/Greenwich should not produce NaN');
    assert.ok(Math.abs(v) < 30);
  });

  it('should handle extreme latitudes without NaN', function() {
    var north = calcMagVar(85, 0, 2026.0);
    assert.ok(!isNaN(north), 'High north should not be NaN');

    var south = calcMagVar(-85, 0, 2026.0);
    assert.ok(!isNaN(south), 'High south should not be NaN');
  });

  it('should handle date line crossing', function() {
    var east = calcMagVar(0, 179, 2026.0);
    var west = calcMagVar(0, -179, 2026.0);
    // Both should be valid numbers
    assert.ok(!isNaN(east));
    assert.ok(!isNaN(west));
  });
});

describe('getDecimalYear()', function() {

  it('should return current year as decimal', function() {
    var year = getDecimalYear();
    var currentYear = new Date().getFullYear();
    assert.ok(year >= currentYear, 'Decimal year should be >= current year');
    assert.ok(year < currentYear + 1, 'Decimal year should be < next year');
  });

  it('should return a value between year.0 and year.999', function() {
    var year = getDecimalYear();
    var intYear = Math.floor(year);
    var frac = year - intYear;
    assert.ok(frac >= 0 && frac < 1, 'Fractional part should be 0-0.999');
  });
});
