'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var createCommand = function createCommand(changeLog, schemaRegistry) {
  var create = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(type, body) {
      var document, transaction;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!(body instanceof Array)) {
                _context.next = 2;
                break;
              }

              return _context.abrupt('return', Promise.all(body.map(function (x) {
                return create(type, x);
              })));

            case 2:
              if (!(type === 'schema' && schemaRegistry.exists(body.name))) {
                _context.next = 4;
                break;
              }

              throw new Error('[Storage.Commands] Attempting to create schema that already exists: ' + name + '.');

            case 4:
              document = schemaRegistry.format(type, body);
              transaction = changeLog.registerNew(type, document);
              return _context.abrupt('return', transaction);

            case 7:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined);
    }));

    return function create(_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }();

  return create;
};

exports.default = createCommand;