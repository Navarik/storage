'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _v = require('uuid/v5');

var _v2 = _interopRequireDefault(_v);

var _arrayUnique = require('array-unique');

var _arrayUnique2 = _interopRequireDefault(_arrayUnique);

var _polyMap = require('poly-map');

var _polyMap2 = _interopRequireDefault(_polyMap);

var _utils = require('./utils');

var _localState = require('./adapters/local-state');

var _changeLog = require('./ports/change-log');

var _changeLog2 = _interopRequireDefault(_changeLog);

var _searchIndex = require('./ports/search-index');

var _searchIndex2 = _interopRequireDefault(_searchIndex);

var _schemaRegistry = require('./ports/schema-registry');

var _schemaRegistry2 = _interopRequireDefault(_schemaRegistry);

var _signatureProvider = require('./ports/signature-provider');

var _signatureProvider2 = _interopRequireDefault(_signatureProvider);

var _transaction = require('./transaction');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Generate same IDs for the each name + namespace combination
var UUID_ROOT = '00000000-0000-0000-0000-000000000000';
var generateId = function generateId(body) {
  return (0, _v2.default)(body.name, UUID_ROOT);
};

var SchemaModel = function () {
  function SchemaModel(config) {
    var _this = this;

    _classCallCheck(this, SchemaModel);

    this.searchIndex = new _searchIndex2.default('schema', config.searchIndex);
    this.changeLog = new _changeLog2.default('schema', config.changeLog);
    this.signature = new _signatureProvider2.default(generateId);
    this.state = new _localState.InMemoryStateAdapter();

    this.changeLog.onChange(function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(schema) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _schemaRegistry2.default.register(schema.body);
                _this.state.set(schema.body.name, schema);
                _context.next = 4;
                return _this.searchIndex.add(schema);

              case 4:
                (0, _transaction.commit)(schema.version_id, schema);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, _this);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }());
  }

  _createClass(SchemaModel, [{
    key: 'init',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var _this2 = this;

        var log;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.changeLog.reconstruct();

              case 2:
                log = _context2.sent;

                log = log.map(function (record) {
                  return record.id ? record : _this2.signature.signNew(record);
                });

                this.state.reset();
                log.forEach(function (schema) {
                  _schemaRegistry2.default.register(schema.body);
                  _this2.state.set(schema.body.name, schema);
                });

                _context2.next = 8;
                return this.searchIndex.init(this.state.getAll());

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function init() {
        return _ref2.apply(this, arguments);
      }

      return init;
    }()

    // Queries

  }, {
    key: 'listTypes',
    value: function listTypes() {
      return Object.keys(this.state.getAll());
    }
  }, {
    key: 'get',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(name, version) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (version) {
                  _context3.next = 2;
                  break;
                }

                return _context3.abrupt('return', this.state.get(name));

              case 2:
                return _context3.abrupt('return', this.state.getVersion(name, version));

              case 3:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function get(_x2, _x3) {
        return _ref3.apply(this, arguments);
      }

      return get;
    }()
  }, {
    key: 'find',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(params) {
        var _this3 = this;

        var found, schemas;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.searchIndex.find(params);

              case 2:
                found = _context4.sent;

                if (found) {
                  _context4.next = 5;
                  break;
                }

                return _context4.abrupt('return', []);

              case 5:
                schemas = found.map(function (x) {
                  return _this3.state.get(x.name);
                });
                return _context4.abrupt('return', schemas);

              case 7:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function find(_x4) {
        return _ref4.apply(this, arguments);
      }

      return find;
    }()

    // Commands

  }, {
    key: 'create',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(body) {
        var schema, record, transaction;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!(!body || !body.name)) {
                  _context5.next = 2;
                  break;
                }

                throw new Error('[Storage] Schema cannot be empty!');

              case 2:
                if (!this.state.exists(body.name)) {
                  _context5.next = 4;
                  break;
                }

                throw new Error('[Storage] Attempting to create schema that already exists: ' + name + '.');

              case 4:
                schema = _schemaRegistry2.default.format(body);
                record = this.signature.signNew(schema);
                transaction = (0, _transaction.start)(record.version_id);

                this.changeLog.register(record);

                return _context5.abrupt('return', transaction.promise);

              case 9:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function create(_x5) {
        return _ref5.apply(this, arguments);
      }

      return create;
    }()
  }, {
    key: 'update',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(name, body) {
        var schema, previous, next, transaction;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!(!body || !name || !body.name)) {
                  _context6.next = 2;
                  break;
                }

                throw new Error('[Storage] Schema cannot be empty!');

              case 2:
                if (this.state.exists(name)) {
                  _context6.next = 4;
                  break;
                }

                throw new Error('[Storage] Attempting to update schema that doesn\'t exist: ' + name + '.');

              case 4:
                schema = _schemaRegistry2.default.format(body);
                previous = this.state.get(name);
                next = this.signature.signVersion(schema, previous);

                if (!(previous.version_id === next.version_id)) {
                  _context6.next = 9;
                  break;
                }

                return _context6.abrupt('return', previous);

              case 9:
                transaction = (0, _transaction.start)(next.version_id);

                this.changeLog.register(next);

                return _context6.abrupt('return', transaction.promise);

              case 12:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function update(_x6, _x7) {
        return _ref6.apply(this, arguments);
      }

      return update;
    }()
  }]);

  return SchemaModel;
}();

exports.default = SchemaModel;