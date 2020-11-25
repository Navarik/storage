'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _nedb = require('nedb');

var _nedb2 = _interopRequireDefault(_nedb);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var databaseError = function databaseError(err) {
  throw new Error('[NeDB] Database error: ' + err);
};

var customTerms = function customTerms(v) {
  if (v instanceof RegExp) {
    return { $regex: v };
  }

  return v;
};

var prepareSearch = function prepareSearch(searchParams) {
  return Object.entries(searchParams || {}).reduce(function (acc, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        k = _ref2[0],
        v = _ref2[1];

    return _extends({}, acc, _defineProperty({}, k, customTerms(v)));
  }, {});
};

var NeDbIndexAdapter = function () {
  function NeDbIndexAdapter() {
    _classCallCheck(this, NeDbIndexAdapter);

    this.clean = false;
    this.reset();
  }

  _createClass(NeDbIndexAdapter, [{
    key: 'find',
    value: function find(searchParams) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return new Promise(function (resolve, reject) {
        var query = _this.client.find(prepareSearch(searchParams), { _id: 0 });

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
    value: function count(searchParams) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.client.count(prepareSearch(searchParams), function (err, res) {
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