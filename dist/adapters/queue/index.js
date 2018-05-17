'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _eventEmitterQueue = require('./event-emitter-queue');

Object.defineProperty(exports, 'EventEmitterQueueAdapter', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_eventEmitterQueue).default;
  }
});

var _redisQueue = require('./redis-queue');

Object.defineProperty(exports, 'RedisQueueAdapter', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_redisQueue).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }