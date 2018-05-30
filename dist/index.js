'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('babel-polyfill');

var _polyMap = require('poly-map');

var _polyMap2 = _interopRequireDefault(_polyMap);

var _changelogAdapterFactory = require('./changelog-adapter-factory');

var _changelogAdapterFactory2 = _interopRequireDefault(_changelogAdapterFactory);

var _searchIndexFactory = require('./search-index-factory');

var _searchIndexFactory2 = _interopRequireDefault(_searchIndexFactory);

var _models = require('./models');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var prependKeys = function prependKeys(prefix, xs) {
  var result = {};
  var keys = Object.keys(xs);

  for (var i = 0; i < keys.length; i++) {
    result[prefix + '.' + keys[i]] = xs[keys[i]];
  }

  return result;
};

var configure = function configure() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var log = config.log || 'default';
  var index = config.index || 'default';
  var namespace = config.namespace || 'storage';

  var schemaChangeLog = config.schema ? (0, _changelogAdapterFactory2.default)(prependKeys(namespace, { schema: config.schema })) : (0, _changelogAdapterFactory2.default)(log.schema || log);

  var entityChangeLog = config.data ? (0, _changelogAdapterFactory2.default)(prependKeys(namespace, config.data)) : (0, _changelogAdapterFactory2.default)(log.entity || log);

  var schemaSearchIndex = (0, _searchIndexFactory2.default)(index.schema || index);
  var entitySearchIndex = (0, _searchIndexFactory2.default)(index.entity || index);

  var schema = new _models.SchemaModel({
    namespace: namespace,
    changeLog: schemaChangeLog,
    searchIndex: schemaSearchIndex
  });

  var entity = new _models.EntityModel({
    namespace: namespace,
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
                return schema.init();

              case 2:
                _context.next = 4;
                return entity.init();

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