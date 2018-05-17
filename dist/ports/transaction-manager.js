'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var noop = function noop() {};

var TransactionManager = function () {
  function TransactionManager(_ref) {
    var _this = this;

    var queue = _ref.queue,
        commitTopic = _ref.commitTopic,
        onCommit = _ref.onCommit;

    _classCallCheck(this, TransactionManager);

    this.transactions = {};
    this.queue = queue;
    this.commitTopic = commitTopic;
    this.onCommit = onCommit || noop;

    this.queue.on(this.commitTopic, function (message) {
      _this.resolve(message);
      _this.onCommit(message.payload);
    });
  }

  _createClass(TransactionManager, [{
    key: 'resolve',
    value: function resolve(_ref2) {
      var transactionId = _ref2.transactionId,
          payload = _ref2.payload;

      this.transactions[transactionId](payload);
      delete this.transactions[transactionId];
    }
  }, {
    key: 'execute',
    value: function execute(topic, payload) {
      var _this2 = this;

      var transactionId = (0, _v2.default)();
      var result = new Promise(function (resolve, reject) {
        _this2.transactions[transactionId] = resolve;
      });

      this.queue.send(topic, { transactionId: transactionId, payload: payload });

      return result;
    }
  }]);

  return TransactionManager;
}();

exports.default = TransactionManager;