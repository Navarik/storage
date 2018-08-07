'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _objectPath = require('object-path');

var _objectPath2 = _interopRequireDefault(_objectPath);

var _searchIndex = require('./search-index');

var _searchIndex2 = _interopRequireDefault(_searchIndex);

var _indexAdapterFactory = require('./index-adapter-factory');

var _indexAdapterFactory2 = _interopRequireDefault(_indexAdapterFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LocalState = function () {
  function LocalState(indexAdapter, idField) {
    _classCallCheck(this, LocalState);

    this.versions = {};
    this.latest = {};
    this.idField = idField;
    this.searchIndex = new _searchIndex2.default((0, _indexAdapterFactory2.default)(indexAdapter), this.idField);
  }

  _createClass(LocalState, [{
    key: 'exists',
    value: function exists(key) {
      return key in this.latest;
    }
  }, {
    key: 'set',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(item) {
        var key;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                key = _objectPath2.default.get(item, this.idField);


                if (!this.versions[key]) {
                  this.versions[key] = [];
                }

                this.versions[key].push(item);
                this.latest[key] = item;

                _context.next = 6;
                return this.searchIndex.add(item);

              case 6:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function set(_x) {
        return _ref.apply(this, arguments);
      }

      return set;
    }()
  }, {
    key: 'get',
    value: function get(key, version) {
      return version ? this.versions[key][version - 1] : this.latest[key];
    }
  }, {
    key: 'getAll',
    value: function getAll() {
      return this.latest;
    }
  }, {
    key: 'reset',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this.latest = {};
                this.versions = {};
                _context2.next = 4;
                return this.searchIndex.reset();

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function reset() {
        return _ref2.apply(this, arguments);
      }

      return reset;
    }()
  }, {
    key: 'isConnected',
    value: function isConnected() {
      return this.searchIndex.isConnected();
    }
  }, {
    key: 'find',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(query, options) {
        var _this = this;

        var found, collection;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.searchIndex.find(query, options);

              case 2:
                found = _context3.sent;
                collection = found.map(function (x) {
                  return _this.get(x.id);
                });
                return _context3.abrupt('return', collection);

              case 5:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function find(_x2, _x3) {
        return _ref3.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'findContent',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(text, options) {
        var _this2 = this;

        var found, collection;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.searchIndex.findContent(text, options);

              case 2:
                found = _context4.sent;
                collection = found.map(function (x) {
                  return _this2.get(x.id);
                });
                return _context4.abrupt('return', collection);

              case 5:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function findContent(_x4, _x5) {
        return _ref4.apply(this, arguments);
      }

      return findContent;
    }()
  }, {
    key: 'count',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(query) {
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt('return', this.searchIndex.count(query));

              case 1:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function count(_x6) {
        return _ref5.apply(this, arguments);
      }

      return count;
    }()
  }]);

  return LocalState;
}();

exports.default = LocalState;