'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _avsc = require('avsc');

var _avsc2 = _interopRequireDefault(_avsc);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SchemaRegistry = function () {
  function SchemaRegistry() {
    _classCallCheck(this, SchemaRegistry);

    this.registry = {};
    this.types = [];
  }

  _createClass(SchemaRegistry, [{
    key: 'register',
    value: function register(schema) {
      delete this.registry[schema.name];
      _avsc2.default.Type.forSchema(schema, { registry: this.registry });

      if (!this.types.includes(schema.name)) {
        this.types.push(schema.name);
      }
    }
  }, {
    key: 'exists',
    value: function exists(name) {
      return this.types.includes(name);
    }
  }, {
    key: 'get',
    value: function get(name) {
      var schema = _avsc2.default.Type.forSchema(name, { registry: this.registry });

      return schema;
    }
  }, {
    key: 'reset',
    value: function reset() {
      var _this = this;

      Object.keys(this.registry).forEach(function (type) {
        delete _this.registry[type];
      });
      this.types = [];
    }
  }, {
    key: 'listUserTypes',
    value: function listUserTypes() {
      return this.types;
    }
  }, {
    key: 'validate',
    value: function validate(type, data) {
      if (type === 'schema') {
        if (!data || !data.name) {
          return '[Storage] Schema cannot be empty!';
        }
      } else {
        if (!this.exists(type)) {
          return '[Storage] Unknown type: ' + type;
        }

        var errors = [];
        this.get(type).isValid(data, { errorHook: function errorHook(path) {
            errors.push(path.join());
          } });
        if (errors.length) {
          return '[Storage] Invalid value provided for: ' + errors.join(', ');
        }
      }

      return '';
    }
  }, {
    key: 'isValid',
    value: function isValid(type, body) {
      var validationErrors = this.validate(type, body);
      var isValid = validationErrors.length === 0;

      return isValid;
    }
  }, {
    key: 'format',
    value: function format(type, data) {
      var validationError = this.validate(type, data);
      if (validationError) {
        throw new Error(validationError);
      }

      if (type === 'schema') {
        return _extends({}, data, {
          type: 'record',
          description: data.description || '',
          fields: data.fields || []
        });
      }

      var schema = this.get(type);
      var response = _extends({}, schema.fromBuffer(schema.toBuffer(data)));

      return response;
    }
  }]);

  return SchemaRegistry;
}();

exports.default = SchemaRegistry;