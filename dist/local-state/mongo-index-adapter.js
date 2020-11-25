'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _mongodb = require('mongodb');

var _object = require('object.omit');

var _object2 = _interopRequireDefault(_object);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var databaseError = function databaseError(err) {
  throw new Error('[MongoDB] Database error: ' + err);
};

var mongifySort = function mongifySort(src) {
  if (!src) {
    return null;
  }

  return (0, _utils.convertSortQueriesToPairs)(src).map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        field = _ref2[0],
        order = _ref2[1];

    return ['body.' + field, order];
  });
};

var mongifyOptions = function mongifyOptions(options) {
  var offset = parseInt(options.offset, 10);
  var limit = parseInt(options.limit, 10);

  var allParams = {
    projection: { _id: 0 },
    skip: Number.isInteger(offset) ? offset : null,
    limit: Number.isInteger(limit) ? limit : null,
    sort: mongifySort(options.sort)
  };

  return (0, _object2.default)(allParams, function (v) {
    return v != null;
  });
};

var customTerms = function customTerms(v) {
  if (v instanceof RegExp) {
    return { $regex: v };
  }

  return v;
};

var mongifySearch = function mongifySearch(searchParams) {
  var $where = searchParams.$where,
      id = searchParams.id,
      version = searchParams.version,
      version_id = searchParams.version_id,
      type = searchParams.type,
      ___content = searchParams.___content,
      ___document = searchParams.___document,
      body = _objectWithoutProperties(searchParams, ['$where', 'id', 'version', 'version_id', 'type', '___content', '___document']);

  var allParams = _extends({
    $where: $where,
    id: id,
    version: version,
    version_id: version_id,
    type: type,
    ___content: ___content,
    ___document: ___document
  }, Object.entries(body).reduce(function (acc, _ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        k = _ref4[0],
        v = _ref4[1];

    return _extends({}, acc, _defineProperty({}, 'body.' + k, customTerms(v)));
  }, {}));

  return (0, _object2.default)(allParams, function (v) {
    return v != null;
  });
};

var collectBody = function collectBody(_ref5) {
  var id = _ref5.id,
      version = _ref5.version,
      version_id = _ref5.version_id,
      type = _ref5.type,
      ___content = _ref5.___content,
      ___document = _ref5.___document,
      body = _objectWithoutProperties(_ref5, ['id', 'version', 'version_id', 'type', '___content', '___document']);

  return { id: id, version: version, version_id: version_id, type: type, ___content: ___content, ___document: ___document, body: body };
};

var MongoDbIndexAdapter = function () {
  function MongoDbIndexAdapter(config) {
    _classCallCheck(this, MongoDbIndexAdapter);

    this.config = {
      url: config.url || 'mongodb://localhost:27017',
      db: config.db || 'storage',
      collection: config.collection || 'data'
    };

    this.supportsRegex = true;
    this.pendingReset = null;
    this.clean = true;
    this.reset();
  }

  _createClass(MongoDbIndexAdapter, [{
    key: 'find',
    value: function find(searchParams) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var mo = mongifyOptions(options);
      var msp = mongifySearch(searchParams);
      return new Promise(function (resolve, reject) {
        try {
          var cursor = _this.collection.find(msp, mo);
          cursor.toArray().then(function (arr) {
            resolve(arr);
          });
        } catch (e) {
          reject(databaseError(e));
        }
      });
    }
  }, {
    key: 'count',
    value: function count(searchParams) {
      var _this2 = this;

      var msp = mongifySearch(searchParams);
      return new Promise(function (resolve, reject) {
        _this2.collection.countDocuments(msp, function (err, res) {
          if (err) reject(databaseError(err));else resolve(res);
        });
      });
    }
  }, {
    key: 'insert',
    value: function insert(documents) {
      var _this3 = this;

      var searchDocs = documents.map(collectBody);
      return new Promise(function (resolve, reject) {
        return _this3.collection.insertMany(searchDocs, function (err, res) {
          if (err) reject(databaseError(err));else resolve(res);
        });
      });
    }
  }, {
    key: 'update',
    value: function update(searchParams, document) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        var searchDoc = collectBody(document);
        _this4.collection.updateOne(searchParams, { $set: searchDoc }, { upsert: true }, function (err, res) {
          if (err) reject(databaseError(err));else resolve(res);
        });
      });
    }
  }, {
    key: 'reset',
    value: function reset() {
      var _this5 = this;

      if (this.pendingReset) {
        return Promise.resolve(this.pendingReset);
      }

      if (this.client) {
        this.client.close();
        this.client = null;
      }

      this.pendingReset = new Promise(function (resolve, reject) {
        var options = {
          useNewUrlParser: true,
          useUnifiedTopology: true
        };
        _mongodb.MongoClient.connect(_this5.config.url, options, function (err, client) {
          if (err) {
            reject(err);
            return;
          }

          _this5.client = client;

          var db = client.db(_this5.config.db);

          db.collection(_this5.config.collection, function (err, col) {
            if (err) {
              reject(err);
              return;
            }

            _this5.collection = col;

            _this5.collection.createIndex({ id: 1 }, { unique: true }).then(function () {
              return resolve(true);
            });
          });
        });
      });

      return this.pendingReset;
    }
  }, {
    key: 'connect',
    value: function connect() {
      return Promise.resolve(this.pendingReset);
    }
  }, {
    key: 'isConnected',
    value: function isConnected() {
      return !!this.client;
    }
  }]);

  return MongoDbIndexAdapter;
}();

exports.default = MongoDbIndexAdapter;