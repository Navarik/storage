'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _changeLog = require('./adapters/change-log');

var _searchIndex = require('./adapters/search-index');

var _schema = require('./schema');

var _schema2 = _interopRequireDefault(_schema);

var _entity = require('./entity');

var _entity2 = _interopRequireDefault(_entity);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var configure = function configure() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var log = config.log || 'default';
  var index = config.index || 'default';

  var schemaChangeLog = config.schema ? (0, _changeLog.createChangelogAdapter)({ schema: config.schema }) : (0, _changeLog.createChangelogAdapter)(log.schema || log);

  var entityChangeLog = config.data ? (0, _changeLog.createChangelogAdapter)(config.data) : (0, _changeLog.createChangelogAdapter)(log.entity || log);

  var schemaSearchIndex = (0, _searchIndex.createSearchIndexAdapter)(index.schema || index);

  var entitySearchIndex = (0, _searchIndex.createSearchIndexAdapter)(index.entity || index);

  var schema = new _schema2.default({
    changeLog: schemaChangeLog,
    searchIndex: schemaSearchIndex
  });

  var entity = new _entity2.default({
    changeLog: entityChangeLog,
    searchIndex: entitySearchIndex
  });

  return {
    getSchema: function getSchema(name, version) {
      return schema.get(name, version);
    },
    findSchema: function findSchema(params) {
      return schema.find(params);
    },
    schemaNames: function schemaNames() {
      return schema.listTypes();
    },
    createSchema: function createSchema(body) {
      return schema.create(body);
    },
    updateSchema: function updateSchema(name, body) {
      return schema.update(name, body);
    },

    find: function find(params, limit, skip) {
      return entity.find(params, limit, skip);
    },
    findData: function findData(params) {
      return entity.findData(params);
    },
    count: function count(params) {
      return entity.findData(params).then(function (xs) {
        return xs.length;
      });
    },

    get: function get(id, version) {
      return entity.get(id, version);
    },
    create: function create(type, body) {
      return body instanceof Array ? Promise.all(body.map(function (x) {
        return entity.create(type, x);
      })) : entity.create(type, body);
    },
    update: function update(id, body) {
      return entity.update(id, body);
    },

    validate: function validate(type, body) {
      return entity.validate(type, body);
    },
    isValid: function isValid(type, body) {
      return entity.isValid(type, body);
    },

    init: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return Promise.all([schemaChangeLog.init(), schemaSearchIndex.init(), entityChangeLog.init(), entitySearchIndex.init()]);

              case 2:
                _context.next = 4;
                return schema.init();

              case 4:
                _context.next = 6;
                return entity.init();

              case 6:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, undefined);
      }));

      function init() {
        return _ref.apply(this, arguments);
      }

      return init;
    }(),

    isConnected: function isConnected() {
      return schemaChangeLog.isConnected() && schemaSearchIndex.isConnected() && entityChangeLog.isConnected() && entitySearchIndex.isConnected();
    }
  };
};

exports.default = configure;