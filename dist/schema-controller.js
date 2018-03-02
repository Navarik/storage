'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateSchema = exports.createSchema = exports.getSchema = exports.findSchemas = undefined;

var _schemaCore = require('@navarik/schema-core');

var schemaModel = _interopRequireWildcard(_schemaCore);

var _utils = require('./utils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var findSchemas = exports.findSchemas = function findSchemas(req) {
  return schemaModel.find(req.params);
};

var getSchema = exports.getSchema = function getSchema(req) {
  return schemaModel.get(req.params.id, req.params.v);
};

var createSchema = exports.createSchema = function createSchema(req, res) {
  return schemaModel.create(req.body).then((0, _utils.created)(res)).catch((0, _utils.conflictError)(res));
};

var updateSchema = exports.updateSchema = function updateSchema(req, res) {
  return schemaModel.update(req.params.id, req.body);
};