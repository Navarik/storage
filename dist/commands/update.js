"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var updateCommand = function updateCommand(changeLog, state, schemaRegistry) {
  var update = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(id, body, options) {
      var previous, type, next, transaction;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (state.exists(id)) {
                _context.next = 2;
                break;
              }

              throw new Error("[Storage.Commands] Can't update " + id + ": it doesn't exist.");

            case 2:
              previous = state.get(id);
              type = previous.type || options.type;

              if (type) {
                _context.next = 6;
                break;
              }

              throw new Error("[Storage.Commands] Type is required from previous.type or options.type for id " + id + ".");

            case 6:
              next = schemaRegistry.format(type, body);
              transaction = changeLog.registerUpdate(type, previous, next);
              return _context.abrupt("return", transaction);

            case 9:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, undefined);
    }));

    return function update(_x, _x2, _x3) {
      return _ref.apply(this, arguments);
    };
  }();

  return update;
};

exports.default = updateCommand;