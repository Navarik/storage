'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.liftToArray = exports.head = exports.get = exports.maybe = exports.map = undefined;

var _polyMap = require('poly-map');

var _polyMap2 = _interopRequireDefault(_polyMap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.map = _polyMap2.default;
var maybe = exports.maybe = function maybe(f) {
  return function (x) {
    return x === undefined ? undefined : f(x);
  };
};

var get = exports.get = function get(name) {
  return maybe(function (object) {
    return object[name];
  });
};

var head = exports.head = function head(xs) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = xs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var x = _step.value;
      return x;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
};

var liftToArray = exports.liftToArray = function liftToArray(func) {
  return function (x) {
    return x instanceof Array ? (0, _polyMap2.default)(func, x) : func(x);
  };
};