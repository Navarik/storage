'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _changelogAdapterFactory = require('./changelog-adapter-factory');

var _changelogAdapterFactory2 = _interopRequireDefault(_changelogAdapterFactory);

var _searchIndexFactory = require('./search-index-factory');

var _searchIndexFactory2 = _interopRequireDefault(_searchIndexFactory);

var _models = require('./models');

var _schemaRegistry = require('./models/schema-registry');

var _schemaRegistry2 = _interopRequireDefault(_schemaRegistry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var configure = function configure() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var log = config.log || 'default';
  var index = config.index || 'default';

  var schemaChangeLog = config.schema ? (0, _changelogAdapterFactory2.default)({ schema: config.schema }) : (0, _changelogAdapterFactory2.default)(log.schema || log);

  var entityChangeLog = config.data ? (0, _changelogAdapterFactory2.default)(config.data) : (0, _changelogAdapterFactory2.default)(log.entity || log);

  var schemaSearchIndex = (0, _searchIndexFactory2.default)(index.schema || index);
  var entitySearchIndex = (0, _searchIndexFactory2.default)(index.entity || index);

  var schema = new _models.SchemaModel({
    changeLog: schemaChangeLog,
    searchIndex: schemaSearchIndex
  });

  var entity = new _models.EntityModel({
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
      return _schemaRegistry2.default.listUserTypes();
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
      return body instanceof Array ? entity.createCollection(type, body) : entity.create(type, body);
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