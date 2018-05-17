'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _parsePath = require('parse-path');

var _parsePath2 = _interopRequireDefault(_parsePath);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DataSoure = function () {
  function DataSoure(config) {
    _classCallCheck(this, DataSoure);

    this.adapters = config.adapters;
  }

  _createClass(DataSoure, [{
    key: 'getAdapter',
    value: function getAdapter(protocol) {
      if (!this.adapters[protocol]) {
        throw new Error('[DataSource] datasources of type ' + protocol + ' are not supported');
      }

      return this.adapters[protocol];
    }
  }, {
    key: 'read',
    value: function read(path) {
      var parsed = (0, _parsePath2.default)(path);
      var adapter = this.getAdapter(parsed.protocol);

      if (!path) {
        return Promise.resolve(undefined);
      }

      return adapter.readAllFiles(parsed);
    }
  }]);

  return DataSoure;
}();

exports.default = DataSoure;