'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _neDbSearchIndexAdapter = require('./ne-db-search-index-adapter');

var _neDbSearchIndexAdapter2 = _interopRequireDefault(_neDbSearchIndexAdapter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createSearchIndexAdapter = function createSearchIndexAdapter(type) {
  if (type === 'default') {
    return new _neDbSearchIndexAdapter2.default();
  }

  return type;
};
exports.default = createSearchIndexAdapter;