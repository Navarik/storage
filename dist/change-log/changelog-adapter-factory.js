'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; // @flow


var _defaultChangelogAdapter = require('./default-changelog-adapter');

var _defaultChangelogAdapter2 = _interopRequireDefault(_defaultChangelogAdapter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createChangelogAdapter = function createChangelogAdapter(type, content) {
  if (type === 'default') {
    if ((typeof content === 'undefined' ? 'undefined' : _typeof(content)) === 'object') {
      return new _defaultChangelogAdapter2.default({ log: content });
    } else {
      return new _defaultChangelogAdapter2.default({});
    }
  }

  return type;
};

exports.default = createChangelogAdapter;