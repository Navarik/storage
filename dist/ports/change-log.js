'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _v = require('uuid/v5');

var _v2 = _interopRequireDefault(_v);

var _arraySort = require('array-sort');

var _arraySort2 = _interopRequireDefault(_arraySort);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ChangeLog = function () {
  function ChangeLog(topic, adapter, generator) {
    _classCallCheck(this, ChangeLog);

    this.adapter = adapter;
    this.topic = topic;
    this.generateId = generator;
    this.listener = function () {};
  }

  _createClass(ChangeLog, [{
    key: 'onChange',
    value: function onChange(func) {
      this.listener = func;
    }
  }, {
    key: 'reconstruct',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var log;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.adapter.read(this.topic);

              case 2:
                log = _context.sent;

                log = (0, _arraySort2.default)(log, 'version');

                return _context.abrupt('return', log);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function reconstruct() {
        return _ref.apply(this, arguments);
      }

      return reconstruct;
    }()
  }, {
    key: 'register',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(document) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.adapter.write(this.topic, document);

              case 2:
                this.listener(document);

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function register(_x) {
        return _ref2.apply(this, arguments);
      }

      return register;
    }()
  }]);

  return ChangeLog;
}();

exports.default = ChangeLog;