/**
 * Test environment setup
 *
 * Provides browser-like globals (window, document, navigator, localStorage)
 * so that the existing JS modules can be loaded in Node.js for testing.
 */

// Minimal DOM stubs
global.document = {
  getElementById: function(id) {
    return {
      textContent: '',
      innerHTML: '',
      style: {},
      classList: {
        add: function() {},
        remove: function() {},
        toggle: function() {},
        contains: function() { return false; }
      },
      value: '',
      setAttribute: function() {},
      getAttribute: function() { return null; },
      addEventListener: function() {},
      querySelectorAll: function() { return []; }
    };
  },
  querySelector: function() {
    return {
      content: '',
      setAttribute: function() {},
      getAttribute: function() { return null; }
    };
  },
  querySelectorAll: function() { return []; },
  documentElement: {
    setAttribute: function() {},
    getAttribute: function() { return null; }
  },
  addEventListener: function() {},
  createElement: function() {
    return {
      style: {},
      appendChild: function() {},
      setAttribute: function() {},
      getAttribute: function() { return null; }
    };
  }
};

global.window = global;

// Minimal localStorage stub
var _storage = {};
global.localStorage = {
  getItem: function(key) { return _storage[key] || null; },
  setItem: function(key, value) { _storage[key] = String(value); },
  removeItem: function(key) { delete _storage[key]; },
  clear: function() { _storage = {}; }
};

// Navigator stub
global.navigator = {
  geolocation: {
    watchPosition: function() { return 1; },
    getCurrentPosition: function() {},
    clearWatch: function() {}
  },
  wakeLock: null,
  userAgent: 'Mozilla/5.0 (Test)'
};

// Location stub
global.location = {
  protocol: 'https:',
  hostname: 'localhost',
  href: 'https://localhost/'
};

// Misc browser globals
global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;
global.setInterval = setInterval;
global.clearInterval = clearInterval;
global.console = console;
global.Date = Date;
global.Math = Math;
global.JSON = JSON;
global.alert = function() {};
global.confirm = function() { return true; };

// Capacitor stub (for native-bridge tests)
global.Capacitor = undefined;

// Reset storage between tests
global.resetTestStorage = function() {
  _storage = {};
};

/**
 * Load a browser JS file into global scope.
 * The file's `var` declarations and `function` declarations
 * become properties of `global`, just like they would be on `window`.
 */
var fs = require('fs');
var vm = require('vm');
global.loadScript = function(filepath) {
  var code = fs.readFileSync(filepath, 'utf8');
  vm.runInThisContext(code, { filename: filepath });
};

var path = require('path');
global.JS_DIR = path.resolve(__dirname, '..', 'js');
