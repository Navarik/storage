'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _beeQueue = require('bee-queue');

var _beeQueue2 = _interopRequireDefault(_beeQueue);

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RedisQueueAdapter = function () {
  function RedisQueueAdapter(config) {
    _classCallCheck(this, RedisQueueAdapter);

    this.topics = {};
    this.client = _redis2.default.createClient(config);
  }

  _createClass(RedisQueueAdapter, [{
    key: 'connect',
    value: function connect() {
      return Promise.resolve(this.client);
    }
  }, {
    key: 'isConnected',
    value: function isConnected() {
      return this.client !== null;
    }
  }, {
    key: 'getQueue',
    value: function getQueue(name) {
      if (!this.topics[name]) {
        this.topics[name] = new _beeQueue2.default(name, { redis: this.client });
      }

      return this.topics[name];
    }
  }, {
    key: 'on',
    value: function on(name, handler) {
      return this.getQueue(name).process(function (job) {
        return Promise.resolve(handler(job.data));
      });
    }
  }, {
    key: 'send',
    value: function send(name, payload) {
      return this.getQueue(name).createJob(payload).save();
    }
  }, {
    key: 'getLog',
    value: function getLog(name) {
      return this.getQueue(name).getJobs('succeeded', { size: 1000000000 }).then(function (jobs) {
        return jobs.map(function (job) {
          return job.data.payload;
        });
      });
      // @todo .payload doesn't belong here: it's originated in Transaction manager
    }
  }]);

  return RedisQueueAdapter;
}();

exports.default = RedisQueueAdapter;