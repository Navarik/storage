'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _nedb = require('nedb');

var _nedb2 = _interopRequireDefault(_nedb);

var _logops = require('logops');

var _logops2 = _interopRequireDefault(_logops);

var _polyExclude = require('poly-exclude');

var _polyExclude2 = _interopRequireDefault(_polyExclude);

var _utils = require('../../utils');

var _neDb = require('./ne-db');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var format = (0, _utils.maybe)((0, _polyExclude2.default)(['_id']));

var databaseError = function databaseError(err) {
  _logops2.default.error('[NeDB] Database error: ' + err);

  return new Error(err);
};

var NeDbClient = function () {
  function NeDbClient() {
    _classCallCheck(this, NeDbClient);

    this.client = new _nedb2.default();
  }

  _createClass(NeDbClient, [{
    key: 'find',
    value: function find(searchParameters) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        return _this.client.find(searchParameters, function (err, res) {
          if (err) reject(databaseError(err));else resolve((0, _utils.map)(format, res));
        });
      });
    }
  }, {
    key: 'insert',
    value: function insert(documents) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        return _this2.client.insert(documents, function (err, res) {
          if (err) reject(databaseError(err));else resolve(res);
        });
      });
    }
  }, {
    key: 'update',
    value: function update(searchParams, document) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        return _this3.client.update(searchParams, document, { upsert: true, multi: true }, function (err, res) {
          if (err) reject(databaseError(err));else resolve(res);
        });
      });
    }
  }]);

  return NeDbClient;
}();

exports.default = NeDbClient;