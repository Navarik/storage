'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _arraySort = require('array-sort');

var _arraySort2 = _interopRequireDefault(_arraySort);

var _groupBy = require('group-by');

var _groupBy2 = _interopRequireDefault(_groupBy);

var _polyMap = require('poly-map');

var _polyMap2 = _interopRequireDefault(_polyMap);

var _functionPipe = require('function-pipe');

var _functionPipe2 = _interopRequireDefault(_functionPipe);

var _arrayFlatten = require('array-flatten');

var _arrayFlatten2 = _interopRequireDefault(_arrayFlatten);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sortByVersionNumber = function sortByVersionNumber(data) {
  return (0, _arraySort2.default)(data, 'version', { reverse: true });
};

var stringifyProperties = (0, _utils.maybe)(function (value) {
  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' ? (0, _polyMap2.default)(stringifyProperties, value) : String(value);
});

var searchableFormat = function searchableFormat(document) {
  return _extends({
    id: document.id,
    version: String(document.version),
    version_id: document.version_id,
    type: document.type
  }, stringifyProperties(document.body));
};

var SearchIndex = function () {
  function SearchIndex() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, SearchIndex);

    this.adapter = config.adapter;
  }

  _createClass(SearchIndex, [{
    key: 'init',
    value: function init(log) {
      var _this = this;

      var versions = Object.values((0, _groupBy2.default)(log, 'id'));
      var latest = (0, _polyMap2.default)((0, _functionPipe2.default)(sortByVersionNumber, _utils.head), versions);

      return this.adapter.reset().then(function () {
        return Promise.all([_this.adapter.insert('versions', log.map(searchableFormat)), _this.adapter.insert('latest', latest.map(searchableFormat))]);
      });
    }
  }, {
    key: 'add',
    value: function add(document) {
      var searchable = searchableFormat(document);

      return Promise.all([this.adapter.insert('versions', [searchable]), this.adapter.update('latest', { id: document.id }, searchable)]);
    }
  }, {
    key: 'addCollection',
    value: function addCollection(documents) {
      var _this2 = this;

      var searchable = documents.map(searchableFormat);

      return Promise.all([this.adapter.insert('versions', searchable)].concat(_toConsumableArray(searchable.map(function (x) {
        return _this2.adapter.update('latest', { id: x.id }, x);
      }))));
    }
  }, {
    key: 'findLatest',
    value: function findLatest(params) {
      return this.adapter.find('latest', stringifyProperties(params)).then(function (xs) {
        return xs || [];
      });
    }
  }, {
    key: 'findVersions',
    value: function findVersions(params) {
      return this.adapter.find('versions', stringifyProperties(params)).then(function (xs) {
        return xs || [];
      });
    }
  }]);

  return SearchIndex;
}();

exports.default = SearchIndex;