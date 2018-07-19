'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _nedb = require('nedb');

var _nedb2 = _interopRequireDefault(_nedb);

var _neDbClient = require('./ne-db-client');

var _neDbClient2 = _interopRequireDefault(_neDbClient);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NeDbSearchIndexAdapter = function () {
  function NeDbSearchIndexAdapter() {
    _classCallCheck(this, NeDbSearchIndexAdapter);

    this.collections = {};
  }

  _createClass(NeDbSearchIndexAdapter, [{
    key: 'getCollection',
    value: function getCollection(name) {
      if (!this.collections[name]) {
        this.collections[name] = new _neDbClient2.default();
      }

      return this.collections[name];
    }
  }, {
    key: 'find',
    value: function find(name, searchParams) {
      return this.getCollection(name).find(searchParams);
    }
  }, {
    key: 'insert',
    value: function insert(name, documents) {
      return this.getCollection(name).insert(documents);
    }
  }, {
    key: 'update',
    value: function update(name, searchParams, document) {
      return this.getCollection(name).update(searchParams, document);
    }
  }, {
    key: 'reset',
    value: function reset() {
      this.collections = {};

      return Promise.resolve(true);
    }
  }, {
    key: 'init',
    value: function init() {
      return Promise.resolve(true);
    }
  }, {
    key: 'isConnected',
    value: function isConnected() {
      return true;
    }
  }]);

  return NeDbSearchIndexAdapter;
}();

exports.default = NeDbSearchIndexAdapter;