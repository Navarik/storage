'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _polyMap = require('poly-map');

var _polyMap2 = _interopRequireDefault(_polyMap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EntityModel = function () {
  function EntityModel(changeLog, state, schemaRegistry) {
    _classCallCheck(this, EntityModel);

    this.changeLog = changeLog;
    this.state = state;
    this.schemaRegistry = schemaRegistry;
  }

  _createClass(EntityModel, [{
    key: 'handleChange',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(entity) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.state.set(entity);

              case 2:
                return _context.abrupt('return', entity);

              case 3:
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
    key: 'create',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(type, body) {
        var entity, transaction;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                entity = this.schemaRegistry.format(type, body);
                transaction = this.changeLog.registerNew(type, entity);
                return _context2.abrupt('return', transaction);

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function create(_x2, _x3) {
        return _ref2.apply(this, arguments);
      }

      return create;
    }()
  }, {
    key: 'update',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(id, body) {
        var previous, next, transaction;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (this.state.exists(id)) {
                  _context3.next = 2;
                  break;
                }

                throw new Error('[Storage] Attempting to update entity that doesn\'t exist: ' + id + '.');

              case 2:
                previous = this.state.get(id);
                next = this.schemaRegistry.format(previous.type, body);
                transaction = this.changeLog.registerUpdate(previous.type, previous, next);
                return _context3.abrupt('return', transaction);

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function update(_x4, _x5) {
        return _ref3.apply(this, arguments);
      }

      return update;
    }()
  }]);

  return EntityModel;
}();

exports.default = EntityModel;