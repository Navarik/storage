'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _avsc = require('avsc');

var _avsc2 = _interopRequireDefault(_avsc);

var _polyMap = require('poly-map');

var _polyMap2 = _interopRequireDefault(_polyMap);

var _curry = require('curry');

var _curry2 = _interopRequireDefault(_curry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var registry = {};

var validate = function validate(type, data) {
  var errors = [];
  var schema = _avsc2.default.Type.forSchema(type, { registry: registry });
  var validator = function validator(body) {
    return schema.isValid(body, { errorHook: function errorHook(path) {
        errors.push(path.join());
      } });
  };

  if (data instanceof Array) {
    data.map(validator);
  } else {
    validator(data);
  }

  return errors;
};

var format = (0, _curry2.default)(function (type, data) {
  var schema = _avsc2.default.Type.forSchema(type, { registry: registry });
  var response = _extends({}, schema.fromBuffer(schema.toBuffer(data)));

  return response;
});

var formatSchema = function formatSchema(schema) {
  return _extends({}, schema, {
    type: 'record',
    description: schema.description || '',
    fields: schema.fields || []
  });
};

var add = function add(schema) {
  var formatted = formatSchema(schema);

  _avsc2.default.Type.forSchema(formatted, { registry: registry });

  return formatted;
};

var update = function update(schema) {
  var formatted = formatSchema(schema);
  var type = formatted.name;

  if (!registry[type]) {
    throw new Error('[SchemaRegistry] Cannot update non-existing schema: ' + type);
  }

  delete registry[type];
  _avsc2.default.Type.forSchema(formatted, { registry: registry });

  return formatted;
};

var get = function get(type) {
  return registry[type];
};

var listAllTypes = function listAllTypes() {
  return Object.keys(registry);
};
var listUserTypes = function listUserTypes() {
  return listAllTypes().filter(function (x) {
    return x.includes('.');
  });
};

var init = function init(source) {
  listAllTypes().forEach(function (type) {
    delete registry[type];
  });
  if (source) {
    source.forEach(add);
  }
};

var schemaRegistry = { add: add, update: update, get: get, format: format, init: init, validate: validate, listAllTypes: listAllTypes, listUserTypes: listUserTypes };

exports.default = schemaRegistry;