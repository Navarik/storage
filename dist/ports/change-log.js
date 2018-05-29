'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _v = require('uuid/v5');

var _v2 = _interopRequireDefault(_v);

var _arraySort = require('array-sort');

var _arraySort2 = _interopRequireDefault(_arraySort);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var signVersion = function signVersion(id, body) {
  if (!id) {
    throw new Error('[ChangeLog] Cannot sign document version: document does not have an ID');
  }

  var versionId = (0, _v2.default)(JSON.stringify(body), id);

  return versionId;
};

var ChangeLog = function () {
  function ChangeLog(topic, adapter, generator) {
    _classCallCheck(this, ChangeLog);

    this.adapter = adapter;
    this.topic = topic;
    this.generateId = generator;

    this.latest = {};
    this.versions = {};
  }

  _createClass(ChangeLog, [{
    key: 'registerAsLatest',
    value: function registerAsLatest(document) {
      this.versions[document.version_id] = document;
      this.latest[document.id] = document;
    }
  }, {
    key: 'register',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(document) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.adapter.write(this.topic, document);

              case 2:
                this.registerAsLatest(document);

                return _context.abrupt('return', document);

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function register(_x) {
        return _ref.apply(this, arguments);
      }

      return register;
    }()
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
    key: 'createNewDocument',
    value: function createNewDocument(body) {
      var now = new Date();
      var id = this.generateId(body);
      var versionId = signVersion(id, body);
      var document = {
        id: id,
        created_at: now.toISOString(),
        version: 1,
        modified_at: now.toISOString(),
        version_id: versionId,
        body: body
      };

      return document;
    }
  }, {
    key: 'reconstruct',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var _this = this;

        var log, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, record;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this.latest = {};
                this.versions = {};

                _context2.next = 4;
                return this.adapter.read(this.topic);

              case 4:
                log = _context2.sent;

                log = (0, _arraySort2.default)(log, 'version');
                log = log.map(function (record) {
                  return record.id ? record : _this.createNewDocument(record);
                });

                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context2.prev = 10;
                for (_iterator = log[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  record = _step.value;

                  this.registerAsLatest(record);
                }

                _context2.next = 18;
                break;

              case 14:
                _context2.prev = 14;
                _context2.t0 = _context2['catch'](10);
                _didIteratorError = true;
                _iteratorError = _context2.t0;

              case 18:
                _context2.prev = 18;
                _context2.prev = 19;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 21:
                _context2.prev = 21;

                if (!_didIteratorError) {
                  _context2.next = 24;
                  break;
                }

                throw _iteratorError;

              case 24:
                return _context2.finish(21);

              case 25:
                return _context2.finish(18);

              case 26:
                return _context2.abrupt('return', log);

              case 27:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[10, 14, 18, 26], [19,, 21, 25]]);
      }));

      function reconstruct() {
        return _ref2.apply(this, arguments);
      }

      return reconstruct;
    }()
  }, {
    key: 'logChange',
    value: function logChange(id, body) {
      var previous = this.getLatestVersion(id);
      if (!previous) {
        throw new Error('[ChangeLog] Cannot create new version because the previous one does not exist');
      }

      var versionId = signVersion(id, body);
      if (previous.version_id === versionId) {
        throw new Error('[ChangeLog] Cannot create new version because it is not different from the current one');
      }

      var versionNumber = previous.version + 1;
      var now = new Date();

      var document = {
        id: id,
        created_at: previous.created_at,
        version: versionNumber,
        modified_at: now.toISOString(),
        version_id: versionId,
        body: body
      };

      return this.register(document);
    }
  }, {
    key: 'logNew',
    value: function logNew(body) {
      return this.register(this.createNewDocument(body));
    }
  }]);

  return ChangeLog;
}();

exports.default = ChangeLog;