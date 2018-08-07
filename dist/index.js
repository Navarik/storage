'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _idGenerator = require('./id-generator');

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _changeLog = require('./change-log');

var _changeLog2 = _interopRequireDefault(_changeLog);

var _schemaRegistry = require('./schema-registry');

var _schemaRegistry2 = _interopRequireDefault(_schemaRegistry);

var _localState = require('./local-state');

var _localState2 = _interopRequireDefault(_localState);

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

var _schema = require('./commands/schema');

var _schema2 = _interopRequireDefault(_schema);

var _entity = require('./commands/entity');

var _entity2 = _interopRequireDefault(_entity);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var configure = function configure() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var log = config.log || 'default';
  var index = config.index || 'default';
  var transactionManager = new _transaction2.default();

  var schemaChangeLog = new _changeLog2.default({
    type: log.schema || log,
    content: config.schema ? { schema: config.schema } : undefined,
    idGenerator: (0, _idGenerator.hashField)('name'),
    transactionManager: transactionManager
  });

  var entityChangeLog = new _changeLog2.default({
    type: log.entity || log,
    content: config.data,
    idGenerator: (0, _idGenerator.random)(),
    transactionManager: transactionManager
  });

  var schemaState = new _localState2.default(index.schema || index, 'body.name');
  var entityState = new _localState2.default(index.entity || index, 'id');

  var schemaRegistry = new _schemaRegistry2.default();
  var entityView = (0, _view2.default)(schemaRegistry);

  var schemaCommands = new _schema2.default(schemaChangeLog, schemaState, schemaRegistry);
  var entityCommands = new _entity2.default(entityChangeLog, entityState, schemaRegistry);

  return {
    getSchema: function getSchema(name, version) {
      return Promise.resolve(schemaState.get(name, version));
    },
    findSchema: function findSchema(query) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return schemaState.find(query, options);
    },
    schemaNames: function schemaNames() {
      return schemaRegistry.listUserTypes();
    },
    createSchema: function createSchema(body) {
      return schemaCommands.create(body);
    },
    updateSchema: function updateSchema(name, body) {
      return schemaCommands.update(name, body);
    },

    get: function get(id, version) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      return Promise.resolve(entityState.get(id, version)).then(entityView(options.view));
    },

    find: function find() {
      var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          limit = _ref.limit,
          offset = _ref.offset,
          view = _ref.view;

      return entityState.find(query, { limit: limit, offset: offset }).then(entityView(view));
    },

    findContent: function findContent() {
      var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          limit = _ref2.limit,
          offset = _ref2.offset,
          view = _ref2.view;

      return entityState.findContent(text, { limit: limit, offset: offset }).then(entityView(view));
    },

    count: function count() {
      var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return entityState.count(query);
    },

    create: function create(type) {
      var body = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      return (body instanceof Array ? Promise.all(body.map(function (x) {
        return entityCommands.create(type, x);
      })) : entityCommands.create(type, body)).then(entityView(options.view));
    },
    update: function update(id, body) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      return entityCommands.update(id, body).then(entityView(options.view));
    },

    validate: function validate(type, body) {
      return schemaRegistry.validate(type, body);
    },
    isValid: function isValid(type, body) {
      return schemaRegistry.isValid(type, body);
    },

    init: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return schemaCommands.init();

              case 2:
                _context.next = 4;
                return entityCommands.init();

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, undefined);
      }));

      function init() {
        return _ref3.apply(this, arguments);
      }

      return init;
    }(),

    isConnected: function isConnected() {
      return schemaChangeLog.isConnected() && schemaState.isConnected() && entityChangeLog.isConnected() && entityState.isConnected();
    }
  };
};

exports.default = configure;