'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _arraySort = require('array-sort');

var _arraySort2 = _interopRequireDefault(_arraySort);

var _signatureProvider = require('./signature-provider');

var _signatureProvider2 = _interopRequireDefault(_signatureProvider);

var _changelogAdapterFactory = require('./changelog-adapter-factory');

var _changelogAdapterFactory2 = _interopRequireDefault(_changelogAdapterFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ChangeLog = function () {
  function ChangeLog(_ref) {
    var type = _ref.type,
        content = _ref.content,
        idGenerator = _ref.idGenerator,
        transactionManager = _ref.transactionManager;

    _classCallCheck(this, ChangeLog);

    this.adapter = (0, _changelogAdapterFactory2.default)(type, content);
    this.signatureProvider = new _signatureProvider2.default(idGenerator);
    this.transactionManager = transactionManager;
  }

  _createClass(ChangeLog, [{
    key: 'onChange',
    value: function onChange(func) {
      var _this = this;

      this.adapter.observe(function () {
        var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(record) {
          var result;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return func(record);

                case 2:
                  result = _context.sent;
                  return _context.abrupt('return', _this.transactionManager.commit(record.version_id, result));

                case 4:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this);
        }));

        return function (_x) {
          return _ref2.apply(this, arguments);
        };
      }());
    }
  }, {
    key: 'isConnected',
    value: function isConnected() {
      return this.adapter.isConnected();
    }
  }, {
    key: 'reconstruct',
    value: function reconstruct(topics) {
      return this.adapter.init(topics, this.signatureProvider);
    }
  }, {
    key: 'registerNew',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(type, document) {
        var record, transaction;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                record = this.signatureProvider.signNew(type, document);
                transaction = this.transactionManager.start(record.version_id);
                _context2.next = 4;
                return this.adapter.write(record);

              case 4:
                return _context2.abrupt('return', transaction.promise);

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function registerNew(_x2, _x3) {
        return _ref3.apply(this, arguments);
      }

      return registerNew;
    }()
  }, {
    key: 'registerUpdate',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(type, oldVersion, document) {
        var newVersion, transaction;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                newVersion = this.signatureProvider.signVersion(type, document, oldVersion);

                if (!(oldVersion.version_id === newVersion.version_id)) {
                  _context3.next = 3;
                  break;
                }

                return _context3.abrupt('return', oldVersion);

              case 3:
                transaction = this.transactionManager.start(newVersion.version_id);
                _context3.next = 6;
                return this.adapter.write(newVersion);

              case 6:
                return _context3.abrupt('return', transaction.promise);

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function registerUpdate(_x4, _x5, _x6) {
        return _ref4.apply(this, arguments);
      }

      return registerUpdate;
    }()
  }]);

  return ChangeLog;
}();

exports.default = ChangeLog;