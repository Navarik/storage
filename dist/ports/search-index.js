'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _polyMap = require('poly-map');

var _polyMap2 = _interopRequireDefault(_polyMap);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var stringifyProperties = (0, _utils.maybe)(function (value) {
  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' ? (0, _polyMap2.default)(stringifyProperties, value) : String(value);
});

var searchableFormat = function searchableFormat(document) {
  return _extends({}, (0, _polyMap2.default)(stringifyProperties, document.body), {
    id: document.id,
    version: String(document.version),
    version_id: document.version_id,
    type: document.type
  });
};

var SearchIndex = function () {
  function SearchIndex(name, adapter) {
    _classCallCheck(this, SearchIndex);

    this.adapter = adapter;
    this.name = name;
  }

  _createClass(SearchIndex, [{
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(log) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.adapter.reset();

              case 2:
                _context.next = 4;
                return this.adapter.insert(this.name, Object.values(log).map(searchableFormat));

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function init(_x) {
        return _ref.apply(this, arguments);
      }

      return init;
    }()
  }, {
    key: 'add',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(document) {
        var searchable;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                searchable = searchableFormat(document);
                _context2.next = 3;
                return this.adapter.update(this.name, { id: document.id }, searchable);

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function add(_x2) {
        return _ref2.apply(this, arguments);
      }

      return add;
    }()
  }, {
    key: 'addCollection',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(documents) {
        var _this = this;

        var searchable;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                searchable = documents.map(searchableFormat);
                return _context3.abrupt('return', (0, _polyMap2.default)(function (x) {
                  return _this.adapter.update(_this.name, { id: x.id }, x);
                }, searchable));

              case 2:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function addCollection(_x3) {
        return _ref3.apply(this, arguments);
      }

      return addCollection;
    }()
  }, {
    key: 'find',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                return _context4.abrupt('return', this.adapter.find(this.name, (0, _polyMap2.default)(stringifyProperties, params)));

              case 1:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function find() {
        return _ref4.apply(this, arguments);
      }

      return find;
    }()
  }]);

  return SearchIndex;
}();

exports.default = SearchIndex;