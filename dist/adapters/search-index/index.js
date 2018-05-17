'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _neDb = require('./ne-db');

Object.defineProperty(exports, 'NeDbSearchIndexAdapter', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_neDb).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }