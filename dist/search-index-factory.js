'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _searchIndex = require('./adapters/search-index');

var _searchIndex2 = require('./ports/search-index');

var _searchIndex3 = _interopRequireDefault(_searchIndex2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createSearchIndex = function createSearchIndex(conf) {
  var adapter = conf;
  if (conf === 'default') {
    adapter = new _searchIndex.NeDbSearchIndexAdapter();
  }

  return new _searchIndex3.default({ adapter: adapter });
};

exports.default = createSearchIndex;