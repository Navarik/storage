'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _neDb = require('./ne-db');

var _neDb2 = _interopRequireDefault(_neDb);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createSearchIndexAdapter = function createSearchIndexAdapter(type) {
  if (type === 'default') {
    return new _neDb2.default();
  }

  return type;
};
exports.default = createSearchIndexAdapter;