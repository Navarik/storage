'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _v = require('uuid/v5');

var _v2 = _interopRequireDefault(_v);

var _arraySort = require('array-sort');

var _arraySort2 = _interopRequireDefault(_arraySort);

var _transactionManager = require('./transaction-manager');

var _transactionManager2 = _interopRequireDefault(_transactionManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sign = function sign(id, payload) {
  if (!id) {
    throw new Error('[ChangeLog] Cannot sign document version: document does not have an ID');
  }

  var versionId = (0, _v2.default)(JSON.stringify(payload), id);

  return versionId;
};

var ChangeLog = function () {
  function ChangeLog() {
    var _this = this;

    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, ChangeLog);

    this.adapter = config.adapter;
    this.topic = config.topic;

    this.latest = {};
    this.versions = {};
    this.transactionManager = new _transactionManager2.default({
      queue: this.adapter,
      commitTopic: this.topic,
      onCommit: function onCommit(payload) {
        return _this.registerAsLatest(payload);
      }
    });
  }

  _createClass(ChangeLog, [{
    key: 'registerAsLatest',
    value: function registerAsLatest(payload) {
      this.versions[payload.version_id] = payload;
      this.latest[payload.id] = payload;
    }
  }, {
    key: 'getVersion',
    value: function getVersion(versionId) {
      return this.versions[versionId];
    }
  }, {
    key: 'getLatestVersion',
    value: function getLatestVersion(id) {
      return this.latest[id];
    }
  }, {
    key: 'reconstruct',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var log, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, record;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.latest = {};
                this.versions = {};

                _context.next = 4;
                return this.adapter.getLog(this.topic);

              case 4:
                log = _context.sent;

                log = (0, _arraySort2.default)(log, 'version');

                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context.prev = 9;
                for (_iterator = log[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  record = _step.value;

                  this.registerAsLatest(record);
                }

                _context.next = 17;
                break;

              case 13:
                _context.prev = 13;
                _context.t0 = _context['catch'](9);
                _didIteratorError = true;
                _iteratorError = _context.t0;

              case 17:
                _context.prev = 17;
                _context.prev = 18;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 20:
                _context.prev = 20;

                if (!_didIteratorError) {
                  _context.next = 23;
                  break;
                }

                throw _iteratorError;

              case 23:
                return _context.finish(20);

              case 24:
                return _context.finish(17);

              case 25:
                return _context.abrupt('return', log);

              case 26:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[9, 13, 17, 25], [18,, 20, 24]]);
      }));

      function reconstruct() {
        return _ref.apply(this, arguments);
      }

      return reconstruct;
    }()
  }, {
    key: 'logChange',
    value: function logChange(id, payload) {
      var previous = this.getLatestVersion(id);
      if (!previous) {
        throw new Error('[ChangeLog] Cannot create new version because the previous one does not exist');
      }

      var versionId = sign(id, payload);
      if (previous.version_id === versionId) {
        throw new Error('[ChangeLog] Cannot create new version because it is not different from the current one');
      }

      var versionNumber = previous.version + 1;
      var now = new Date();

      var document = {
        id: id,
        type: previous.type,
        created_at: previous.created_at,
        version: versionNumber,
        modified_at: now.toISOString(),
        version_id: versionId,
        payload: payload
      };

      return this.transactionManager.execute(this.topic, document);
    }
  }, {
    key: 'logNew',
    value: function logNew(type, id, payload) {
      var now = new Date();
      var versionId = sign(id, payload);
      var document = {
        id: id,
        type: type,
        created_at: now.toISOString(),
        version: 1,
        modified_at: now.toISOString(),
        version_id: versionId,
        payload: payload
      };

      return this.transactionManager.execute(this.topic, document);
    }
  }, {
    key: 'observe',
    value: function observe(func) {
      this.adapter.on(this.topic, func);
    }
  }]);

  return ChangeLog;
}();

exports.default = ChangeLog;