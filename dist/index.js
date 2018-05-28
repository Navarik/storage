'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('babel-polyfill');

var _queue = require('./adapters/queue');

var _searchIndex = require('./adapters/search-index');

var _searchIndex2 = require('./ports/search-index');

var _searchIndex3 = _interopRequireDefault(_searchIndex2);

var _changeLog = require('./ports/change-log');

var _changeLog2 = _interopRequireDefault(_changeLog);

var _models = require('./models');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var createChangelogAdapter = function createChangelogAdapter(conf) {
  if (conf === 'default') {
    return new _queue.EventEmitterQueueAdapter({});
  }

  if (conf instanceof Array) {
    return new _queue.EventEmitterQueueAdapter({ log: conf });
  }

  return conf;
};

var configureSearchIndexAdapter = function configureSearchIndexAdapter(conf) {
  var adapter = conf;
  if (conf === 'default') {
    adapter = new _searchIndex.NeDbSearchIndexAdapter();
  }

  return adapter;
};

var configure = function configure() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var log = config.log || 'default';
  var index = config.index || 'default';
  var namespace = config.namespace || 'storage';

  var schemaChangeLog = new _changeLog2.default({
    topic: namespace + '.schema',
    adapter: createChangelogAdapter(log.schema || log)
  });
  var entityChangeLog = new _changeLog2.default({
    topic: namespace + '.entity',
    adapter: createChangelogAdapter(log.entity || log)
  });

  var schemaSearchIndex = new _searchIndex3.default({
    adapter: configureSearchIndexAdapter(index.schema || index)
  });
  var entitySearchIndex = new _searchIndex3.default({
    adapter: configureSearchIndexAdapter(index.entity || index)
  });

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
    get: function get(id, version) {
      return entity.get(id, version);
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
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return schema.init(config.schema || []);

              case 2:
                _context.next = 4;
                return entity.init(config.data || []);

              case 4:
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