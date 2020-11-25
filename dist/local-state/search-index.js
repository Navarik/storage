'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _objectPath = require('object-path');

var _objectPath2 = _interopRequireDefault(_objectPath);

var _polyMap = require('poly-map');

var _polyMap2 = _interopRequireDefault(_polyMap);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var stringifyProperties = (0, _utils.maybe)(function (value) {
  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' ? value instanceof RegExp ? value : (0, _polyMap2.default)(stringifyProperties, value) : String(value);
});

var stringifyContent = function stringifyContent(value) {
  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value !== null ? Object.values(value).reduce(function (acc, next) {
    return acc + stringifyContent(next);
  }, '') : String(value || '');
};

var searchableFormat = function searchableFormat(idField, document) {
  return _extends({}, (0, _polyMap2.default)(stringifyProperties, document.body), {
    // save the original document under ___document, storage expect local-state to return ___document
    ___document: document,
    ___content: stringifyContent(document.body),
    id: _objectPath2.default.get(document, idField),
    version: String(document.version),
    version_id: document.version_id,
    type: document.type
  });
};

var SearchIndex = function () {
  function SearchIndex(adapter, idField) {
    _classCallCheck(this, SearchIndex);

    this.adapter = adapter;
    this.idField = idField;
  }

  _createClass(SearchIndex, [{
    key: 'reset',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.adapter.connect();

              case 2:
                _context.next = 4;
                return this.adapter.reset();

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function reset() {
        return _ref.apply(this, arguments);
      }

      return reset;
    }()
  }, {
    key: 'isClean',
    value: function isClean() {
      return this.adapter.clean;
    }
  }, {
    key: 'isConnected',
    value: function isConnected() {
      return this.adapter.isConnected();
    }
  }, {
    key: 'add',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(document) {
        var searchable, current;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                searchable = searchableFormat(this.idField, document);
                _context2.next = 3;
                return this.adapter.find({ id: searchable.id });

              case 3:
                current = _context2.sent;

                if (!current.length) {
                  _context2.next = 9;
                  break;
                }

                _context2.next = 7;
                return this.adapter.update({ id: searchable.id }, searchable);

              case 7:
                _context2.next = 11;
                break;

              case 9:
                _context2.next = 11;
                return this.adapter.insert([searchable]);

              case 11:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function add(_x) {
        return _ref2.apply(this, arguments);
      }

      return add;
    }()
  }, {
    key: 'find',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(params, options) {
        var query, documents;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                query = (0, _polyMap2.default)(stringifyProperties, params);
                _context3.next = 3;
                return this.adapter.find(query, options);

              case 3:
                documents = _context3.sent;
                return _context3.abrupt('return', documents);

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
        var regex, query, documents;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                regex = text instanceof RegExp ? text : new RegExp(text, 'gi');
                query = this.adapter.supportsRegex ? { ___content: { $regex: regex } } : { $where: function $where() {
                    return this.___content.match(regex) !== null;
                  } };
                _context4.next = 4;
                return this.adapter.find(query, options);

              case 4:
                documents = _context4.sent;
                return _context4.abrupt('return', documents);

              case 6:
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
                return _context5.abrupt('return', this.adapter.count(query));

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

  return SearchIndex;
}();

exports.default = SearchIndex;