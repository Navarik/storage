'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _eventEmitter = require('./event-emitter');

var _eventEmitter2 = _interopRequireDefault(_eventEmitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createChangelogAdapter = function createChangelogAdapter(type) {
  if (type === 'default') {
    return new _eventEmitter2.default({});
  } else if (type.constructor === Object) {
    return new _eventEmitter2.default({ log: type });
  }

  return type;
};
exports.default = createChangelogAdapter;