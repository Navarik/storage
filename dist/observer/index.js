'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _listener = require('./listener');

var _listener2 = _interopRequireDefault(_listener);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Observer = function () {
  function Observer() {
    _classCallCheck(this, Observer);

    this.listeners = [];
  }

  _createClass(Observer, [{
    key: 'listen',
    value: function listen(filter, handler) {
      this.listeners.push((0, _listener2.default)(filter, handler));
    }
  }, {
    key: 'emit',
    value: function emit(event) {
      this.listeners.forEach(function (listener) {
        return listener(event);
      });
    }
  }]);

  return Observer;
}();

exports.default = Observer;