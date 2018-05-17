'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('babel-polyfill');

var _dataSource = require('./adapters/data-source');

var _queue = require('./adapters/queue');

var _searchIndex = require('./adapters/search-index');

var _searchIndex2 = require('./ports/search-index');

var _searchIndex3 = _interopRequireDefault(_searchIndex2);

var _dataSource2 = require('./ports/data-source');

var _dataSource3 = _interopRequireDefault(_dataSource2);

var _changeLog = require('./ports/change-log');

var _changeLog2 = _interopRequireDefault(_changeLog);

var _models = require('./models');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var dataSource = new _dataSource3.default({
  adapters: {
    file: new _dataSource.FilesystemDatasourceAdapter({ format: 'json' }),
    git: new _dataSource.GitDatasourceAdapter({
      workingDirectory: process.env.TEMP_DIRECTORY,
      format: 'json'
    })
  }
});

var createChangelogAdapter = function createChangelogAdapter(conf) {
  return conf === 'default' ? new _queue.EventEmitterQueueAdapter() : conf;
};

var configureSearchIndex = function configureSearchIndex(conf) {
  var adapter = conf;
  if (conf === 'default') {
    adapter = new _searchIndex.NeDbSearchIndexAdapter();
  }

  return new _searchIndex3.default({ adapter: adapter });
};

var configure = function configure(config) {
  var queue = config.queue || 'default';
  var index = config.index || 'default';

  var schemaChangeLog = new _changeLog2.default({
    topic: 'schema',
    adapter: createChangelogAdapter(queue.schema || queue)
  });
  var entityChangeLog = new _changeLog2.default({
    topic: 'entity',
    adapter: createChangelogAdapter(queue.entity || queue)
  });

  var schemaSearchIndex = configureSearchIndex(index.schema || index);
  var entitySearchIndex = configureSearchIndex(index.entity || index);

  var schema = new _models.SchemaModel({
    changeLog: schemaChangeLog,
    searchIndex: schemaSearchIndex
  });

  var entity = new _models.EntityModel({
    changeLog: entityChangeLog,
    searchIndex: entitySearchIndex
  });

  return {
    getNamespaces: function getNamespaces() {
      return schema.getNamespaces();
    },
    getSchema: function getSchema(name, version) {
      return schema.get(name, version);
    },
    findSchema: function findSchema(params) {
      return schema.find(params);
    },
    createSchema: function createSchema(body) {
      return schema.create('schema', body);
    },
    updateSchema: function updateSchema(name, body) {
      return schema.update(name, body);
    },

    find: function find(params) {
      return entity.find(params);
    },
    get: function get(name, version) {
      return entity.get(name, version);
    },
    create: function create(type, body) {
      return entity.create(type, body);
    },
    update: function update(id, body) {
      return entity.update(id, body);
    },

    validate: function validate(type, body) {
      return entity.validate(type, body);
    },

    init: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var sources = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var schemaSource, entitySource;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return Promise.all([schemaChangeLog.adapter.connect(), entityChangeLog.adapter.connect()]);

              case 2:
                _context.next = 4;
                return dataSource.read(sources.schemata);

              case 4:
                schemaSource = _context.sent;
                _context.next = 7;
                return dataSource.read(sources.data);

              case 7:
                entitySource = _context.sent;
                _context.next = 10;
                return schema.init(schemaSource);

              case 10:
                _context.next = 12;
                return entity.init(entitySource);

              case 12:
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
    }()
  };
};

exports.default = configure;