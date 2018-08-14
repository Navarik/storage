'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TransactionManager = function () {
  function TransactionManager() {
    _classCallCheck(this, TransactionManager);

    this.transactions = {};
  }

  _createClass(TransactionManager, [{
    key: 'commit',
    value: function commit(key, message) {
      if (this.transactions[key]) {
        this.transactions[key].resolve(message);
        delete this.transactions[key];
      }
    }
  }, {
    key: 'reject',
    value: function reject(key, message) {
      if (this.transactions[key]) {
        this.transactions[key].reject(message);
        delete this.transactions[key];
      }
    }
  }, {
    key: 'start',
    value: function start(key) {
      var transaction = new _transaction2.default();
      this.transactions[key] = transaction;

      return transaction;
    }
  }]);

  return TransactionManager;
}();

exports.default = TransactionManager;