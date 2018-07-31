'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _nedb = require('nedb');

var _nedb2 = _interopRequireDefault(_nedb);

var _polyMap = require('poly-map');

var _polyMap2 = _interopRequireDefault(_polyMap);

var _neDbSearchIndexAdapter = require('./ne-db-search-index-adapter');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var databaseError = function databaseError(err) {
  throw new Error('[NeDB] Database error: ' + err);
};

var NeDbClient = function () {
  function NeDbClient() {
    _classCallCheck(this, NeDbClient);

    this.client = new _nedb2.default();
    this.client.ensureIndex({ fieldName: 'id', unique: true });
  }

  _createClass(NeDbClient, [{
    key: 'find',
    value: function find(searchParameters) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return new Promise(function (resolve, reject) {
        var query = _this.client.find(searchParameters);
        if (options.skip) {
          query.skip(options.skip);
        }
        if (options.limit) {
          query.limit(options.limit);
        }

        query.exec(function (err, res) {
          if (err) reject(databaseError(err));else resolve(res);
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