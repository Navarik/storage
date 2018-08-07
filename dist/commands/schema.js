'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SchemaModel = function () {
  function SchemaModel(changeLog, state, schemaRegistry) {
    _classCallCheck(this, SchemaModel);

    this.changeLog = changeLog;
    this.state = state;
    this.schemaRegistry = schemaRegistry;
  }

  _createClass(SchemaModel, [{
    key: 'handleChange',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(schema) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.schemaRegistry.register(schema.body);
                _context.next = 3;
                return this.state.set(schema);

              case 3:
                return _context.abrupt('return', schema);

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function handleChange(_x) {
        return _ref.apply(this, arguments);
      }

      return handleChange;
    }()
  }, {
    key: 'init',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var _this = this;

        var log;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this.schemaRegistry.reset();
                this.state.reset();

                _context2.next = 4;
                return this.changeLog.reconstruct('schema');

              case 4:
                log = _context2.sent;
                _context2.next = 7;
                return Promise.all(log.map(function (x) {
                  return _this.handleChange(x);
                }));

              case 7:

                this.changeLog.onChange('schema', function (x) {
                  return _this.handleChange(x);
                });

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

    // Commands

  }, {
    key: 'create',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(body) {
        var schema, transaction;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!this.schemaRegistry.exists(body.name)) {
                  _context3.next = 2;
                  break;
                }

                throw new Error('[Storage] Attempting to create schema that already exists: ' + name + '.');

              case 2:
                schema = this.schemaRegistry.format('schema', body);
                transaction = this.changeLog.registerNew('schema', schema);
                return _context3.abrupt('return', transaction);

              case 5:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function create(_x2) {
        return _ref3.apply(this, arguments);
      }

      return create;
    }()
  }, {
    key: 'update',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(name, body) {
        var previous, next, transaction;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (this.state.exists(name)) {
                  _context4.next = 2;
                  break;
                }

                throw new Error('[Storage] Attempting to update schema that doesn\'t exist: ' + name + '.');

              case 2:
                previous = this.state.get(name);
                next = this.schemaRegistry.format('schema', body);
                transaction = this.changeLog.registerUpdate('schema', previous, next);
                return _context4.abrupt('return', transaction);

              case 6:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function update(_x3, _x4) {
        return _ref4.apply(this, arguments);
      }

      return update;
    }()
  }]);

  return SchemaModel;
}();

exports.default = SchemaModel;