'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _inMemoryStateAdapter = require('./in-memory-state-adapter');

Object.defineProperty(exports, 'InMemoryStateAdapter', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_inMemoryStateAdapter).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }