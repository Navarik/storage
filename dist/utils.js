'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.created = exports.badRequestError = exports.conflictError = undefined;

var _curry = require('curry');

var _curry2 = _interopRequireDefault(_curry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var conflictError = exports.conflictError = (0, _curry2.default)(function (res, err) {
  res.status(409);return err.message || err;
});
var badRequestError = exports.badRequestError = (0, _curry2.default)(function (res, err) {
  res.status(400);return err.message || err;
});
var created = exports.created = (0, _curry2.default)(function (res, result) {
  res.status(201);return result;
});