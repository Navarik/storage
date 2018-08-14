'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('babel-polyfill');

var _idGenerator = require('./id-generator');

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _changeLog = require('./change-log');

var _changeLog2 = _interopRequireDefault(_changeLog);

var _schemaRegistry = require('./schema-registry');

var _schemaRegistry2 = _interopRequireDefault(_schemaRegistry);

var _localState = require('./local-state');

var _localState2 = _interopRequireDefault(_localState);

var _observer = require('./observer');

var _observer2 = _interopRequireDefault(_observer);

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

var _create = require('./commands/create');

var _create2 = _interopRequireDefault(_create);

var _update = require('./commands/update');

var _update2 = _interopRequireDefault(_update);

var _init = require('./commands/init');

var _init2 = _interopRequireDefault(_init);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

  var observer = new _observer2.default();

  var schemaRegistry = new _schemaRegistry2.default();
  var entityView = (0, _view2.default)(schemaRegistry);

  var _createSchema = (0, _create2.default)(schemaChangeLog, schemaRegistry);
  var createEntity = (0, _create2.default)(entityChangeLog, schemaRegistry);

  var _updateSchema = (0, _update2.default)(schemaChangeLog, schemaState, schemaRegistry);
  var updateEntity = (0, _update2.default)(entityChangeLog, entityState, schemaRegistry);

  var init = (0, _init2.default)(schemaChangeLog, entityChangeLog, schemaState, entityState, schemaRegistry, observer);

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
      return _createSchema('schema', body);
    },
    updateSchema: function updateSchema(name, body) {
      return _updateSchema(name, body);
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
      return createEntity(type, body).then(entityView(options.view));
    },

    update: function update(id, body) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      return updateEntity(id, body).then(entityView(options.view));
    },

    validate: function validate(type, body) {
      return schemaRegistry.validate(type, body);
    },
    isValid: function isValid(type, body) {
      return schemaRegistry.isValid(type, body);
    },

    observe: function observe(handler) {
      var filter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return observer.listen(filter, handler);
    },

    init: init,
    isConnected: function isConnected() {
      return schemaChangeLog.isConnected() && schemaState.isConnected() && entityChangeLog.isConnected() && entityState.isConnected();
    }
  };
};

exports.default = configure;