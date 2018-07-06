'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

var _polyMap = require('poly-map');

var _polyMap2 = _interopRequireDefault(_polyMap);

var _curry = require('curry');

var _curry2 = _interopRequireDefault(_curry);

var _arrayFlatten = require('array-flatten');

var _arrayFlatten2 = _interopRequireDefault(_arrayFlatten);

var _changeLog = require('../ports/change-log');

var _changeLog2 = _interopRequireDefault(_changeLog);

var _schemaRegistry = require('./schema-registry');

var _schemaRegistry2 = _interopRequireDefault(_schemaRegistry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var generateId = function generateId(body) {
  return (0, _v2.default)();
};
var isDefined = function isDefined(x) {
  return x !== undefined;
};

var wrapEntity = (0, _curry2.default)(function (type, document) {
  return _extends({}, document, {
    type: type,
    schema: _schemaRegistry2.default.get(type).schema()
  });
});

var EntityModel = function () {
  function EntityModel(config) {
    _classCallCheck(this, EntityModel);

    this.searchIndex = config.searchIndex;
    this.changelogAdapter = config.changeLog;
    this.changelogs = {};
  }

  _createClass(EntityModel, [{
    key: 'getChangelog',
    value: function getChangelog(type) {
      if (!this.changelogs[type]) {
        this.changelogs[type] = new _changeLog2.default(type, this.changelogAdapter, generateId);
      }

      return this.changelogs[type];
    }
  }, {
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var _this = this;

        var types, logs;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                types = _schemaRegistry2.default.listUserTypes();
                _context.next = 3;
                return Promise.all(types.map(function (type) {
                  return _this.getChangelog(type).reconstruct().then((0, _polyMap2.default)(function (data) {
                    return _extends({}, data, { type: type });
                  }));
                }));

              case 3:
                logs = _context.sent;
                _context.next = 6;
                return this.searchIndex.init((0, _arrayFlatten2.default)(logs));

              case 6:
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
    key: 'find',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(params) {
        var _this2 = this;

        var found, entities;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.searchIndex.findLatest(params);

              case 2:
                found = _context2.sent;
                entities = found.map(function (x) {
                  return wrapEntity(x.type, _this2.getChangelog(x.type).getLatestVersion(x.id));
                });
                return _context2.abrupt('return', entities);

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
  }, {
    key: 'get',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(id, version) {
        var found, type, log, data, entity;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!version) {
                  _context3.next = 6;
                  break;
                }

                _context3.next = 3;
                return this.searchIndex.findVersions({ id: id, version: version });

              case 3:
                _context3.t0 = _context3.sent;
                _context3.next = 9;
                break;

              case 6:
                _context3.next = 8;
                return this.searchIndex.findLatest({ id: id });

              case 8:
                _context3.t0 = _context3.sent;

              case 9:
                found = _context3.t0;

                if (!(found.length === 0)) {
                  _context3.next = 12;
                  break;
                }

                return _context3.abrupt('return', undefined);

              case 12:
                type = found[0].type;
                log = this.getChangelog(type);
                data = log.getVersion(found[0].version_id);
                entity = wrapEntity(type, data);
                return _context3.abrupt('return', entity);

              case 17:
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

    // Commands

  }, {
    key: 'validate',
    value: function validate(type, body) {
      return _schemaRegistry2.default.validate(type, body);
    }
  }, {
    key: 'isValid',
    value: function isValid(type, body) {
      var validationErrors = _schemaRegistry2.default.validate(type, body);
      var isValid = validationErrors.length === 0;

      return isValid;
    }
  }, {
    key: 'create',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(type, body) {
        var validationErrors, log, format, record, entity;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                validationErrors = _schemaRegistry2.default.validate(type, body);

                if (!validationErrors.length) {
                  _context4.next = 3;
                  break;
                }

                throw new Error('[Entity] Invalid value provided for: ' + validationErrors.join(', '));

              case 3:
                log = this.getChangelog(type);
                format = _schemaRegistry2.default.format(type);
                _context4.next = 7;
                return log.logNew(format(body));

              case 7:
                record = _context4.sent;
                entity = wrapEntity(type, record);
                _context4.next = 11;
                return this.searchIndex.add(entity);

              case 11:
                return _context4.abrupt('return', entity);

              case 12:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function create(_x4, _x5) {
        return _ref4.apply(this, arguments);
      }

      return create;
    }()
  }, {
    key: 'createCollection',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(type, bodies) {
        var validationErrors, log, format, records, entities;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                validationErrors = _schemaRegistry2.default.validate(type, bodies);

                if (!validationErrors.length) {
                  _context5.next = 3;
                  break;
                }

                throw new Error('[Entity] Invalid value provided for: ' + validationErrors.join(', '));

              case 3:
                log = this.getChangelog(type);
                format = _schemaRegistry2.default.format(type);
                _context5.next = 7;
                return Promise.all(bodies.map(function (x) {
                  return log.logNew(format(x));
                }));

              case 7:
                records = _context5.sent;
                entities = records.map(wrapEntity(type));
                _context5.next = 11;
                return this.searchIndex.addCollection(entities);

              case 11:
                return _context5.abrupt('return', entities);

              case 12:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function createCollection(_x6, _x7) {
        return _ref5.apply(this, arguments);
      }

      return createCollection;
    }()
  }, {
    key: 'update',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(id, body) {
        var current, validationErrors, formatted, entityRecord, entity;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return this.get(id);

              case 2:
                current = _context6.sent;

                if (current) {
                  _context6.next = 5;
                  break;
                }

                throw new Error('[Entity] Entity doesn\'s exist for ID: ' + id);

              case 5:
                validationErrors = _schemaRegistry2.default.validate(current.type, body);

                if (!validationErrors.length) {
                  _context6.next = 8;
                  break;
                }

                throw new Error('[Entity] Invalid value provided for: ' + validationErrors.join(', '));

              case 8:
                formatted = _schemaRegistry2.default.format(current.type, body);
                _context6.next = 11;
                return this.getChangelog(current.type).logChange(id, formatted);

              case 11:
                entityRecord = _context6.sent;
                entity = wrapEntity(current.type, entityRecord);
                _context6.next = 15;
                return this.searchIndex.add(entity);

              case 15:
                return _context6.abrupt('return', entity);

              case 16:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function update(_x8, _x9) {
        return _ref6.apply(this, arguments);
      }

      return update;
    }()
  }]);

  return EntityModel;
}();

exports.default = EntityModel;