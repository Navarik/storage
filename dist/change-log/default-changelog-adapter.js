'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _polyMap = require('poly-map');

var _polyMap2 = _interopRequireDefault(_polyMap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DefaultChangelogAdapter = function () {
  function DefaultChangelogAdapter(config) {
    _classCallCheck(this, DefaultChangelogAdapter);

    this.observer = function () {};
    this.log = config.log || {};
  }

  _createClass(DefaultChangelogAdapter, [{
    key: 'observe',
    value: function observe(handler) {
      this.observer = handler;
    }
  }, {
    key: 'write',
    value: function write(type, message) {
      return this.observer(_extends({}, message, { type: type }));
    }
  }, {
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(types, signatureProvider) {
        var _this = this;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return (0, _polyMap2.default)(function () {
                  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(type) {
                    var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, data, record;

                    return regeneratorRuntime.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            if (!_this.log[type]) {
                              _context.next = 28;
                              break;
                            }

                            _iteratorNormalCompletion = true;
                            _didIteratorError = false;
                            _iteratorError = undefined;
                            _context.prev = 4;
                            _iterator = _this.log[type][Symbol.iterator]();

                          case 6:
                            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                              _context.next = 14;
                              break;
                            }

                            data = _step.value;
                            record = data.id ? data : signatureProvider.signNew(data);
                            _context.next = 11;
                            return _this.write(type, record);

                          case 11:
                            _iteratorNormalCompletion = true;
                            _context.next = 6;
                            break;

                          case 14:
                            _context.next = 20;
                            break;

                          case 16:
                            _context.prev = 16;
                            _context.t0 = _context['catch'](4);
                            _didIteratorError = true;
                            _iteratorError = _context.t0;

                          case 20:
                            _context.prev = 20;
                            _context.prev = 21;

                            if (!_iteratorNormalCompletion && _iterator.return) {
                              _iterator.return();
                            }

                          case 23:
                            _context.prev = 23;

                            if (!_didIteratorError) {
                              _context.next = 26;
                              break;
                            }

                            throw _iteratorError;

                          case 26:
                            return _context.finish(23);

                          case 27:
                            return _context.finish(20);

                          case 28:
                          case 'end':
                            return _context.stop();
                        }
                      }
                    }, _callee, _this, [[4, 16, 20, 28], [21,, 23, 27]]);
                  }));

                  return function (_x3) {
                    return _ref2.apply(this, arguments);
                  };
                }(), types);

              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function init(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return init;
    }()
  }, {
    key: 'isConnected',
    value: function isConnected() {
      return true;
    }
  }]);

  return DefaultChangelogAdapter;
}();

exports.default = DefaultChangelogAdapter;