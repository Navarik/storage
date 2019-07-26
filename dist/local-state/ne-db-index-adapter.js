'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _nedb = require('nedb');

var _nedb2 = _interopRequireDefault(_nedb);

var _polyMap = require('poly-map');

var _polyMap2 = _interopRequireDefault(_polyMap);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var databaseError = function databaseError(err) {
  throw new Error('[NeDB] Database error: ' + err);
};

var NeDbIndexAdapter = function () {
  function NeDbIndexAdapter() {
    _classCallCheck(this, NeDbIndexAdapter);

    this.reset();
  }

  _createClass(NeDbIndexAdapter, [{
    key: 'find',
    value: function find(searchParameters) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return new Promise(function (resolve, reject) {
        var query = _this.client.find(searchParameters, { id: 1, type: 1, _id: 0 });

        var offset = parseInt(options.offset, 10);
        if (Number.isInteger(offset)) {
          query.skip(offset);
        }

        var limit = parseInt(options.limit, 10);
        if (Number.isInteger(limit)) {
          query.limit(limit);
        }

        if (options.sort) {
          // Translate the array of sort queries from Express format to NeDB cursor.sort() format. Example:
          //    received this:         [ 'vessels:asc', 'foo.bar.baz:desc', ... ]
          //    helper function makes: [ ['vessels', 1], ['foo.bar.baz', -1], ...]
          //    NeDB wants this:       { vessels: 1 , 'foo.bar.baz': -1, ... }
          var nedbSortingObject = {};
          (0, _utils.convertSortQueriesToPairs)(options.sort).map(function (pair) {
            return nedbSortingObject[pair[0]] = pair[1];
          });

          query.sort(nedbSortingObject);
        }

        query.exec(function (err, res) {
          if (err) reject(databaseError(err));else resolve(res || []);
        });
      });
    }
  }, {
    key: 'count',
    value: function count(searchParameters) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.client.count(searchParameters, function (err, res) {
          if (err) reject(databaseError(err));else resolve(res);
        });
      });
    }
  }, {
    key: 'insert',
    value: function insert(documents) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        return _this3.client.insert(documents, function (err, res) {
          if (err) reject(databaseError(err));else resolve(res);
        });
      });
    }
  }, {
    key: 'update',
    value: function update(searchParams, document) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        return _this4.client.update(searchParams, document, { upsert: true, multi: true }, function (err, res) {
          if (err) reject(databaseError(err));else resolve(res);
        });
      });
    }
  }, {
    key: 'reset',
    value: function reset() {
      this.client = new _nedb2.default();
      this.client.ensureIndex({ fieldName: 'id', unique: true });

      return Promise.resolve(true);
    }
  }, {
    key: 'connect',
    value: function connect() {
      return Promise.resolve(true);
    }
  }, {
    key: 'isConnected',
    value: function isConnected() {
      return true;
    }
  }]);

  return NeDbIndexAdapter;
}();

exports.default = NeDbIndexAdapter;