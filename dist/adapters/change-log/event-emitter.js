'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventEmitter = require('event-emitter');

var _eventEmitter2 = _interopRequireDefault(_eventEmitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DefaultChangelogAdapter = function () {
  function DefaultChangelogAdapter(config) {
    _classCallCheck(this, DefaultChangelogAdapter);

    this.emitter = (0, _eventEmitter2.default)();
    this.log = config.log || {};
  }

  _createClass(DefaultChangelogAdapter, [{
    key: 'on',
    value: function on(topic, handler) {
      this.emitter.on(topic, handler);
    }
  }, {
    key: 'write',
    value: function write(topic, message) {
      this.emitter.emit(topic, message);

      return Promise.resolve(message);
    }
  }, {
    key: 'read',
    value: function read(topic) {
      return Promise.resolve(this.log[topic] || []);
    }
  }]);

  return DefaultChangelogAdapter;
}();

exports.default = DefaultChangelogAdapter;