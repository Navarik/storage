'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var initCommand = function initCommand(schemaChangeLog, entityChangeLog, schemaState, entityState, schemaRegistry, observer) {
  var init = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
      var types;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return schemaRegistry.reset();

            case 2:
              _context3.next = 4;
              return schemaState.reset();

            case 4:
              _context3.next = 6;
              return entityState.reset();

            case 6:

              schemaChangeLog.onChange(function () {
                var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(schema) {
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          schemaRegistry.register(schema.body);
                          _context.next = 3;
                          return schemaState.set(schema);

                        case 3:
                          return _context.abrupt('return', schema);

                        case 4:
                        case 'end':
                          return _context.stop();
                      }
                    }
                  }, _callee, undefined);
                }));

                return function (_x) {
                  return _ref2.apply(this, arguments);
                };
              }());

              entityChangeLog.onChange(function () {
                var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(entity) {
                  return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          observer.emit(entity);
                          _context2.next = 3;
                          return entityState.set(entity);

                        case 3:
                          return _context2.abrupt('return', entity);

                        case 4:
                        case 'end':
                          return _context2.stop();
                      }
                    }
                  }, _callee2, undefined);
                }));

                return function (_x2) {
                  return _ref3.apply(this, arguments);
                };
              }());

              _context3.next = 10;
              return schemaChangeLog.reconstruct(['schema']);

            case 10:
              types = schemaRegistry.listUserTypes();
              _context3.next = 13;
              return entityChangeLog.reconstruct(types);

            case 13:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, undefined);
    }));

    return function init() {
      return _ref.apply(this, arguments);
    };
  }();

  return init;
};

exports.default = initCommand;