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

    this.searchIndex = new _searchIndex2.default('entity', config.searchIndex);
    this.changelogAdapter = config.changeLog;
    this.signature = new _signatureProvider2.default(generateId);
    this.changelogs = {};
    this.state = new _localState.InMemoryStateAdapter();
  }

  _createClass(EntityModel, [{
    key: 'getChangelog',
    value: function getChangelog(type) {
      var _this = this;

      if (!this.changelogs[type]) {
        this.changelogs[type] = new _changeLog2.default(type, this.changelogAdapter, generateId);
        this.changelogs[type].onChange(function () {
          var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(record) {
            var entity;
            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    entity = _extends({}, record, { type: type });

                    _this.state.set(record.id, entity);
                    _context.next = 4;
                    return _this.searchIndex.add(entity);

                  case 4:
                    (0, _transaction.commit)(record.version_id, wrapEntity(type, record));

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

      return this.changelogs[type];
    }
  }, {
    key: 'init',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var _this2 = this;

        var types;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this.state.reset();

                types = _schemaRegistry2.default.listUserTypes();
                _context2.next = 4;
                return Promise.all(types.map(function (type) {
                  return _this2.getChangelog(type).reconstruct().then((0, _polyMap2.default)(function (record) {
                    var entity = record.id ? record : _this2.signature.signNew(record);
                    _this2.state.set(entity.id, _extends({}, entity, { type: type }));
                  }));
                }));

              case 4:
                _context2.next = 6;
                return this.searchIndex.init(this.state.getAll());

              case 6:
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
    key: 'find',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(params) {
        var _this3 = this;

        var found, entities;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                found = Object.values(this.state.getAll());

                if (found) {
                  _context3.next = 3;
                  break;
                }

                return _context3.abrupt('return', []);

              case 3:
                entities = found.map(function (x) {
                  return wrapEntity(x.type, _this3.state.get(x.id));
                });
                return _context3.abrupt('return', entities);

              case 5:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function find(_x2) {
        return _ref3.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'findData',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(params) {
        var _this4 = this;

        var found, entities;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.searchIndex.find(params);

              case 2:
                found = _context4.sent;
                entities = found.map(function (x) {
                  return _extends({}, _this4.state.get(x.id), {
                    id: x.id
                  });
                });
                return _context4.abrupt('return', entities);

              case 5:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function findData(_x3) {
        return _ref4.apply(this, arguments);
      }

      return findData;
    }()
  }, {
    key: 'get',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(id, version) {
        var found, entity;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                found = version ? this.state.getVersion(id, version) : this.state.get(id);

                if (found) {
                  _context5.next = 3;
                  break;
                }

                return _context5.abrupt('return', undefined);

              case 3:
                entity = wrapEntity(found.type, found);
                return _context5.abrupt('return', entity);

              case 5:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function get(_x4, _x5) {
        return _ref5.apply(this, arguments);
      }

      return get;
    }()

    // Commands

  }, {
    key: 'validate',
    value: function validate(type, body) {
      var validationErrors = _schemaRegistry2.default.validate(type, body);
      if (validationErrors.length) {
        return '[Entity] Invalid value provided for: ' + validationErrors.join(', ');
      }

      return '';
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
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(type, body) {
        var validationError, entity, record, transaction;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                validationError = this.validate(type, body);

                if (!validationError) {
                  _context6.next = 3;
                  break;
                }

                throw new Error(validationError);

              case 3:
                entity = _schemaRegistry2.default.formatData(type, body);
                record = this.signature.signNew(entity);
                transaction = (0, _transaction.start)(record.version_id);

                this.getChangelog(type).register(record);

                return _context6.abrupt('return', transaction.promise);

              case 8:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function create(_x6, _x7) {
        return _ref6.apply(this, arguments);
      }

      return create;
    }()
  }, {
    key: 'update',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(id, body) {
        var previous, type, validationError, entity, next, transaction;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if (this.state.exists(id)) {
                  _context7.next = 2;
                  break;
                }

                throw new Error('[Storage] Attempting to update entity that doesn\'t exist: ' + id + '.');

              case 2:
                previous = this.state.get(id);
                type = previous.type;
                validationError = this.validate(type, body);

                if (!validationError) {
                  _context7.next = 7;
                  break;
                }

                throw new Error(validationError);

              case 7:
                entity = _schemaRegistry2.default.formatData(type, body);
                next = this.signature.signVersion(entity, previous);
                transaction = (0, _transaction.start)(next.version_id);

                this.getChangelog(type).register(next);

                return _context7.abrupt('return', transaction.promise);

              case 12:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function update(_x8, _x9) {
        return _ref7.apply(this, arguments);
      }

      return update;
    }()
  }]);

  return EntityModel;
}();

exports.default = EntityModel;