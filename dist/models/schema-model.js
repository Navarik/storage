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

var _utils = require('../utils');

var _changeLog = require('../ports/change-log');

var _changeLog2 = _interopRequireDefault(_changeLog);

var _schemaRegistry = require('./schema-registry');

var _schemaRegistry2 = _interopRequireDefault(_schemaRegistry);

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
    _classCallCheck(this, SchemaModel);

    this.searchIndex = config.searchIndex;
    this.changeLog = new _changeLog2.default('schema', config.changeLog, generateId);
  }

  _createClass(SchemaModel, [{
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var log;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.changeLog.reconstruct();

              case 2:
                log = _context.sent;
                _context.next = 5;
                return _schemaRegistry2.default.init(log.map(function (x) {
                  return x.body;
                }));

              case 5:
                _context.next = 7;
                return this.searchIndex.init(log);

              case 7:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function init() {
        return _ref.apply(this, arguments);
      }

      return init;
    }()

    // Queries

  }, {
    key: 'get',
    value: function get(name, version) {
      var _this = this;

      var schema = _schemaRegistry2.default.get(name);
      if (!schema) return Promise.resolve(undefined);

      var id = generateId(schema);

      if (!version) {
        return Promise.resolve(this.changeLog.getLatestVersion(id));
      }

      return this.searchIndex.findVersions({ id: id, version: version }).then(_utils.head).then((0, _utils.maybe)(function (x) {
        return _this.changeLog.getVersion(x.version_id);
      }));
    }
  }, {
    key: 'find',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(params) {
        var _this2 = this;

        var found, schemas;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.searchIndex.findLatest(params);

              case 2:
                found = _context2.sent;
                schemas = found.map(function (x) {
                  return _this2.changeLog.getLatestVersion(x.id);
                });
                return _context2.abrupt('return', schemas);

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function find(_x) {
        return _ref2.apply(this, arguments);
      }

      return find;
    }()

    // Commands

  }, {
    key: 'create',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(type, body) {
        var schema, schemaRecord;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                schema = _schemaRegistry2.default.add(body);
                _context3.next = 3;
                return this.changeLog.logNew(schema);

              case 3:
                schemaRecord = _context3.sent;
                _context3.next = 6;
                return this.searchIndex.add(schemaRecord);

              case 6:
                return _context3.abrupt('return', schemaRecord);

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function create(_x2, _x3) {
        return _ref3.apply(this, arguments);
      }

      return create;
    }()
  }, {
    key: 'update',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(name, body) {
        var schema, id, schemaRecord;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                schema = _schemaRegistry2.default.update(body);
                id = generateId(body);
                _context4.next = 4;
                return this.changeLog.logChange(id, schema);

              case 4:
                schemaRecord = _context4.sent;
                _context4.next = 7;
                return this.searchIndex.add(schemaRecord);

              case 7:
                return _context4.abrupt('return', schemaRecord);

              case 8:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function update(_x4, _x5) {
        return _ref4.apply(this, arguments);
      }

      return update;
    }()
  }]);

  return SchemaModel;
}();

exports.default = SchemaModel;