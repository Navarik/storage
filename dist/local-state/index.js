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
  function LocalState(indexAdapter, idField, trackVersions, transform, logger) {
    _classCallCheck(this, LocalState);

    this.versions = {};
    // note that idField targets the document and not the searchableFormat in searchIndex
    this.idField = idField;
    this.trackVersions = trackVersions;
    this.transform = transform;
    this.searchIndex = new _searchIndex2.default((0, _indexAdapterFactory2.default)(indexAdapter), this.idField);
    this.logger = logger;
  }

  _createClass(LocalState, [{
    key: 'isClean',
    value: function isClean() {
      return this.searchIndex.isClean();
    }
  }, {
    key: 'exists',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(key) {
        var document;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.get(key);

              case 2:
                document = _context.sent;
                return _context.abrupt('return', !!document);

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function exists(_x) {
        return _ref.apply(this, arguments);
      }

      return exists;
    }()
  }, {
    key: 'set',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(item) {
        var key, doc;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                key = _objectPath2.default.get(item, this.idField);
                doc = JSON.parse(JSON.stringify(item));

                if (typeof this.transform === 'function') {
                  try {
                    doc = this.transform(doc);
                  } catch (err) {
                    // log error and continue without transform
                    this.logger.error('[Storage] LocalState transform encountered an exception.', err);
                    doc = item;
                  }
                }

                // TOOD: move versions to searchIndex
                if (this.trackVersions) {
                  if (!this.versions[key]) {
                    this.versions[key] = [];
                  }

                  this.versions[key].push(doc);
                }

                _context2.next = 6;
                return this.searchIndex.add(doc);

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function set(_x2) {
        return _ref2.apply(this, arguments);
      }

      return set;
    }()
  }, {
    key: 'get',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(key, version) {
        var documents, latest;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(version && this.trackVersions === false)) {
                  _context3.next = 2;
                  break;
                }

                throw new Error('[Storage] Local State is running without version tracking.');

              case 2:
                _context3.next = 4;
                return this.find({ id: key });

              case 4:
                documents = _context3.sent;
                latest = documents.length ? documents[0] : undefined;
                return _context3.abrupt('return', version ? this.versions[key][version - 1] : latest);

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function get(_x3, _x4) {
        return _ref3.apply(this, arguments);
      }

      return get;
    }()
  }, {
    key: 'getAll',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                return _context4.abrupt('return', this.find());

              case 1:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function getAll() {
        return _ref4.apply(this, arguments);
      }

      return getAll;
    }()
  }, {
    key: 'reset',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                this.versions = {};
                _context5.next = 3;
                return this.searchIndex.reset();

              case 3:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function reset() {
        return _ref5.apply(this, arguments);
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
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(query, options) {
        var searchables;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return this.searchIndex.find(query, options);

              case 2:
                searchables = _context6.sent;
                return _context6.abrupt('return', searchables.map(function (searchable) {
                  return searchable.___document;
                }));

              case 4:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function find(_x5, _x6) {
        return _ref6.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'findContent',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(text, options) {
        var searchables;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return this.searchIndex.findContent(text, options);

              case 2:
                searchables = _context7.sent;
                return _context7.abrupt('return', searchables.map(function (searchable) {
                  return searchable.___document;
                }));

              case 4:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function findContent(_x7, _x8) {
        return _ref7.apply(this, arguments);
      }

      return findContent;
    }()
  }, {
    key: 'count',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(query) {
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                return _context8.abrupt('return', this.searchIndex.count(query));

              case 1:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function count(_x9) {
        return _ref8.apply(this, arguments);
      }

      return count;
    }()
  }]);

  return LocalState;
}();

exports.default = LocalState;