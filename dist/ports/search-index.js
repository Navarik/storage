'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _arraySort = require('array-sort');

var _arraySort2 = _interopRequireDefault(_arraySort);

var _groupBy = require('group-by');

var _groupBy2 = _interopRequireDefault(_groupBy);

var _polyMap = require('poly-map');

var _polyMap2 = _interopRequireDefault(_polyMap);

var _arrayFlatten = require('array-flatten');

var _arrayFlatten2 = _interopRequireDefault(_arrayFlatten);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sortByVersionNumber = function sortByVersionNumber(data) {
  return (0, _arraySort2.default)(data, 'version', { reverse: true });
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
      var latest = (0, _arrayFlatten2.default)((0, _polyMap2.default)(sortByVersionNumber, versions));

      return this.adapter.reset().then(function () {
        return Promise.all([_this.adapter.insert('versions', log), _this.adapter.insert('latest', latest)]);
      });
    }
  }, {
    key: 'add',
    value: function add(document) {
      return Promise.all([this.adapter.insert('versions', [document]), this.adapter.update('latest', { id: document.id }, document)]);
    }
  }, {
    key: 'findLatest',
    value: function findLatest(params) {
      return this.adapter.find('latest', params).then(function (xs) {
        return xs || [];
      });
    }
  }, {
    key: 'findVersions',
    value: function findVersions(params) {
      return this.adapter.find('versions', params).then(function (xs) {
        return xs || [];
      });
    }
  }]);

  return SearchIndex;
}();

exports.default = SearchIndex;