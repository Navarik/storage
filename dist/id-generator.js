'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.random = exports.hashField = undefined;

var _v = require('uuid/v5');

var _v2 = _interopRequireDefault(_v);

var _v3 = require('uuid/v4');

var _v4 = _interopRequireDefault(_v3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var UUID_ROOT = '00000000-0000-0000-0000-000000000000';
var hashField = exports.hashField = function hashField(fieldName) {
  return function (body) {
    return (0, _v2.default)(body[fieldName], UUID_ROOT);
  };
};

var random = exports.random = function random() {
  return function (body) {
    return (0, _v4.default)();
  };
};