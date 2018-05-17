'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

var _utils = require('../utils');

var _schemaRegistry = require('./schema-registry');

var _schemaRegistry2 = _interopRequireDefault(_schemaRegistry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var generateId = function generateId(body) {
  return (0, _v2.default)();
};
var stringifyProperties = (0, _utils.map)(function (x) {
  return String(x);
});

var searchableFormat = (0, _utils.liftToArray)(function (data) {
  return _extends({
    id: data.id,
    version: String(data.version),
    version_id: data.version_id,
    type: data.type
  }, stringifyProperties(data.payload));
});

var EntityModel = function () {
  function EntityModel(config) {
    _classCallCheck(this, EntityModel);

    this.searchIndex = config.searchIndex;
    this.changeLog = config.changeLog;
  }

  _createClass(EntityModel, [{
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(source) {
        var _this = this;

        var log;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return source ? Promise.all(source.map(function (entity) {
                  return _this.changeLog.logNew(entity.type, generateId(), entity.payload);
                })) : this.changeLog.reconstruct();

              case 2:
                log = _context.sent;
                _context.next = 5;
                return this.searchIndex.init(log.map(searchableFormat));

              case 5:
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
                return this.searchIndex.findLatest(stringifyProperties(params));

              case 2:
                found = _context2.sent;
                entities = found.map(function (x) {
                  return _this2.changeLog.getLatestVersion(x.id);
                });
                return _context2.abrupt('return', entities);

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function find(_x2) {
        return _ref2.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'get',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(id, version) {
        var searchQuery, versions;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (version) {
                  _context3.next = 2;
                  break;
                }

                return _context3.abrupt('return', this.changeLog.getLatestVersion(id));

              case 2:
                searchQuery = stringifyProperties({ id: id, version: version });
                _context3.next = 5;
                return this.searchIndex.findVersions(searchQuery);

              case 5:
                versions = _context3.sent;

                if (!(versions.length === 0)) {
                  _context3.next = 8;
                  break;
                }

                return _context3.abrupt('return', undefined);

              case 8:
                return _context3.abrupt('return', this.changeLog.getVersion(versions[0].version_id));

              case 9:
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

    // Commands

  }, {
    key: 'validate',
    value: function validate(type, body) {
      var validationErrors = _schemaRegistry2.default.validate(type, body);
      var isValid = validationErrors.length === 0;

      return isValid;
    }
  }, {
    key: 'create',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(type, body) {
        var validationErrors, entity, id, entityRecord;
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
                entity = _schemaRegistry2.default.format(type, body);
                id = generateId();
                _context4.next = 7;
                return this.changeLog.logNew(type, id, entity);

              case 7:
                entityRecord = _context4.sent;
                _context4.next = 10;
                return this.searchIndex.add(searchableFormat(entityRecord));

              case 10:
                return _context4.abrupt('return', entityRecord);

              case 11:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function create(_x5, _x6) {
        return _ref4.apply(this, arguments);
      }

      return create;
    }()
  }, {
    key: 'update',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(id, body) {
        var _changeLog$getLatestV, type, validationErrors, entity, entityRecord;

        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _changeLog$getLatestV = this.changeLog.getLatestVersion(id), type = _changeLog$getLatestV.type;
                validationErrors = _schemaRegistry2.default.validate(type, body);

                if (!validationErrors.length) {
                  _context5.next = 4;
                  break;
                }

                throw new Error('[Entity] Invalid value provided for: ' + validationErrors.join(', '));

              case 4:
                entity = _schemaRegistry2.default.format(type, body);
                _context5.next = 7;
                return this.changeLog.logChange(id, entity);

              case 7:
                entityRecord = _context5.sent;
                _context5.next = 10;
                return this.searchIndex.add(searchableFormat(entityRecord));

              case 10:
                return _context5.abrupt('return', entityRecord);

              case 11:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function update(_x7, _x8) {
        return _ref5.apply(this, arguments);
      }

      return update;
    }()
  }]);

  return EntityModel;
}();

exports.default = EntityModel;