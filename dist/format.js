'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _curry = require('curry');

var _curry2 = _interopRequireDefault(_curry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var enforceType = function enforceType(type, value) {
  switch (type) {
    case 'string':
      return String(value || '');
    case 'number':
      return Number(value || 0);
    default:
      return value;
  }
};

var enforceSchema = (0, _curry2.default)(function (schema, data) {
  var result = {
    type: schema.namespace + '.' + schema.name
  };

  for (var i in schema.fields) {
    var _schema$fields$i = schema.fields[i],
        name = _schema$fields$i.name,
        type = _schema$fields$i.type;

    result[name] = enforceType(type, data[name]);
  }

  return result;
});

exports.default = enforceSchema;