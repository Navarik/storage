'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var escape = function escape(str) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
var makeRegex = function makeRegex(str) {
  var pre = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var suf = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  return new RegExp('' + pre + escape(str) + suf, 'i');
};

var findSubstring = exports.findSubstring = function findSubstring(str) {
  return makeRegex(str);
};
var findPrefix = exports.findPrefix = function findPrefix(str) {
  return makeRegex(str, '^\\s*');
};
var findSuffix = exports.findSuffix = function findSuffix(str) {
  return makeRegex(str, '', '\\s*$');
};