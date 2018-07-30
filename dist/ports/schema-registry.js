'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _avsc = require('avsc');

var _avsc2 = _interopRequireDefault(_avsc);

var _polyMap = require('poly-map');

var _polyMap2 = _interopRequireDefault(_polyMap);

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

var formatData = function formatData(type, data) {
  var schema = _avsc2.default.Type.forSchema(type, { registry: registry });
  var response = _extends({}, schema.fromBuffer(schema.toBuffer(data)));

  return response;
};

var format = function format(schema) {
  return _extends({}, schema, {
    type: 'record',
    description: schema.description || '',
    fields: schema.fields || []
  });
};

var register = function register(schema) {
  var formatted = format(schema);

  delete registry[formatted.name];
  _avsc2.default.Type.forSchema(formatted, { registry: registry });

  return formatted;
};

var get = function get(name) {
  return registry[name];
};

var init = function init(source) {
  Object.keys(registry).forEach(function (type) {
    delete registry[type];
  });

  if (source) {
    source.forEach(register);
  }
};

var listUserTypes = function listUserTypes() {
  return Object.keys(registry).filter(function (x) {
    return x.includes('.');
  });
};

var schemaRegistry = { format: format, register: register, get: get, init: init, validate: validate, formatData: formatData, listUserTypes: listUserTypes };

exports.default = schemaRegistry;