'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _neDbIndexAdapter = require('./ne-db-index-adapter');

var _neDbIndexAdapter2 = _interopRequireDefault(_neDbIndexAdapter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createIndexAdapter = function createIndexAdapter(adapter) {
  if (adapter === 'default') {
    return new _neDbIndexAdapter2.default();
  }

  return adapter;
};

exports.default = createIndexAdapter;