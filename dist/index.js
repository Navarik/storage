'use strict';

require('babel-polyfill');

var _schemaCore = require('@navarik/schema-core');

var schema = _interopRequireWildcard(_schemaCore);

var _entityCore = require('@navarik/entity-core');

var entity = _interopRequireWildcard(_entityCore);

var _httpServer = require('@navarik/http-server');

var _httpServer2 = _interopRequireDefault(_httpServer);

var _schemaController = require('./schema-controller');

var _entityController = require('./entity-controller');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Healthchecks
_httpServer2.default.addHealthCheck(schema.isConnected, 'Schema storage error');
_httpServer2.default.addHealthCheck(entity.isConnected, 'Entity storage error');

// Mount business logic
_httpServer2.default.mount('get', '/namespaces', schema.namespaces);

_httpServer2.default.mount('post', '/schemas', _schemaController.createSchema);
_httpServer2.default.mount('post', '/schemata', _schemaController.createSchema);
_httpServer2.default.mount('get', '/schemas', _schemaController.findSchemas);
_httpServer2.default.mount('get', '/schemata', _schemaController.findSchemas);
_httpServer2.default.mount('put', '/schema/:id', _schemaController.updateSchema);
_httpServer2.default.mount('get', '/schema/:id', _schemaController.getSchema);
_httpServer2.default.mount('get', '/schema/:id/version/:v', _schemaController.getSchema);
_httpServer2.default.mount('get', '/schema/:id/v/:v', _schemaController.getSchema);

_httpServer2.default.mount('post', '/entities', _entityController.createEntity);
_httpServer2.default.mount('get', '/entities', _entityController.findEntities);
_httpServer2.default.mount('put', '/entity/:id', _entityController.updateEntity);
_httpServer2.default.mount('get', '/entity/:id', _entityController.getEntity);
_httpServer2.default.mount('get', '/entity/:id/version/:v', _entityController.getEntity);
_httpServer2.default.mount('get', '/entity/:id/v/:v', _entityController.getEntity);

// Connect to databases then start web-server
Promise.all([schema.connect({ location: process.env.DATA_LOCATION }), entity.connect({ location: process.env.DATA_LOCATION })]).then(function () {
  return _httpServer2.default.start(process.env.PORT);
});