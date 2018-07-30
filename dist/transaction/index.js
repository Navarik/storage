'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.start = exports.reject = exports.commit = undefined;

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var transactions = {};

var commit = exports.commit = function commit(key, message) {
  if (transactions[key]) {
    transactions[key].resolve(message);
    delete transactions[key];
  }
};

var reject = exports.reject = function reject(key, message) {
  if (transactions[key]) {
    transactions[key].reject(message);
    delete transactions[key];
  }
};

var start = exports.start = function start(key) {
  var transaction = new _transaction2.default();
  transactions[key] = transaction;

  return transaction;
};