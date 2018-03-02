'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateEntity = exports.createEntity = exports.getEntity = exports.findEntities = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var queryEntities = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req) {
    var data, types, schema;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return entityModel.find(req.params);

          case 2:
            data = _context.sent;
            types = (0, _arrayUnique2.default)(data.map(function (x) {
              return x.type;
            }));
            _context.next = 6;
            return Promise.all(types.map(schemaModel.get));

          case 6:
            schema = _context.sent;
            return _context.abrupt('return', { data: data, schema: schema });

          case 8:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function queryEntities(_x) {
    return _ref.apply(this, arguments);
  };
}();

var queryNamespace = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(req) {
    var searchParams, schema, data;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            searchParams = (0, _polyExclude2.default)(['namespace'], req.params);
            _context2.next = 3;
            return schemaModel.find({ namespace: req.params.namespace });

          case 3:
            _context2.t0 = _context2.sent;

            if (_context2.t0) {
              _context2.next = 6;
              break;
            }

            _context2.t0 = [];

          case 6:
            schema = _context2.t0;
            _context2.next = 9;
            return Promise.all(schemata.map(schemaId).map(function (type) {
              return entityModel.find(_extends({}, searchParams, { type: type }));
            }));

          case 9:
            data = _context2.sent;
            return _context2.abrupt('return', { data: (0, _arrayFlatten2.default)(data), schema: schema });

          case 11:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function queryNamespace(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var getEntity = exports.getEntity = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(req, res) {
    var data, schema;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return entityModel.get(req.params.id, req.params.v);

          case 2:
            data = _context3.sent;

            if (!(data === undefined)) {
              _context3.next = 5;
              break;
            }

            return _context3.abrupt('return', undefined);

          case 5:
            _context3.next = 7;
            return schemaModel.get(data.type);

          case 7:
            schema = _context3.sent;
            return _context3.abrupt('return', { data: data, schema: schema });

          case 9:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function getEntity(_x3, _x4) {
    return _ref3.apply(this, arguments);
  };
}();

var createOneEntity = function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(req, res) {
    var typeName, schema, data;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            typeName = req.body.type;
            _context4.next = 3;
            return schemaModel.get(typeName);

          case 3:
            schema = _context4.sent;
            _context4.next = 6;
            return entityModel.create((0, _format2.default)(schema, req.body));

          case 6:
            data = _context4.sent;
            return _context4.abrupt('return', (0, _utils.created)(res, { data: data, schema: schema }));

          case 8:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function createOneEntity(_x5, _x6) {
    return _ref4.apply(this, arguments);
  };
}();

var createCollection = function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(req, res) {
    var allSchemata, schema, data;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return Promise.all(req.body.map(function (x) {
              return schemaModel.get(x.type);
            }));

          case 2:
            allSchemata = _context5.sent;
            schema = indexById((0, _arrayUnique2.default)(allSchemata));
            _context5.next = 6;
            return Promise.all(req.body.map(function (x) {
              return entityModel.create((0, _format2.default)(schema[x.type], x));
            }));

          case 6:
            data = _context5.sent;
            return _context5.abrupt('return', (0, _utils.created)(res, { data: data, schema: schema }));

          case 8:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function createCollection(_x7, _x8) {
    return _ref5.apply(this, arguments);
  };
}();

var updateEntity = exports.updateEntity = function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(req, res) {
    var old, type, schema, data;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return entityModel.get(req.params.id);

          case 2:
            old = _context6.sent;

            if (old) {
              _context6.next = 5;
              break;
            }

            return _context6.abrupt('return', undefined);

          case 5:
            type = req.body.type || old.type;
            _context6.next = 8;
            return schemaModel.get(type);

          case 8:
            schema = _context6.sent;

            if (schema) {
              _context6.next = 11;
              break;
            }

            return _context6.abrupt('return', (0, _utils.badRequestError)(res, 'Schema not found for type: ' + type));

          case 11:
            _context6.next = 13;
            return entityModel.update(req.params.id, (0, _format2.default)(schema, req.body));

          case 13:
            data = _context6.sent;
            return _context6.abrupt('return', { data: data, schema: schema });

          case 15:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function updateEntity(_x9, _x10) {
    return _ref6.apply(this, arguments);
  };
}();

var _arrayUnique = require('array-unique');

var _arrayUnique2 = _interopRequireDefault(_arrayUnique);

var _polyExclude = require('poly-exclude');

var _polyExclude2 = _interopRequireDefault(_polyExclude);

var _arrayFlatten = require('array-flatten');

var _arrayFlatten2 = _interopRequireDefault(_arrayFlatten);

var _entityCore = require('@navarik/entity-core');

var entityModel = _interopRequireWildcard(_entityCore);

var _schemaCore = require('@navarik/schema-core');

var schemaModel = _interopRequireWildcard(_schemaCore);

var _utils = require('./utils');

var _format = require('./format');

var _format2 = _interopRequireDefault(_format);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var schemaId = function schemaId(x) {
  return x.namespace + '.' + x.name;
};
var indexById = function indexById(xs) {
  return xs.reduce(function (acc, x) {
    return _extends({}, acc, _defineProperty({}, schemaId(x), x));
  }, {});
};

var findEntities = exports.findEntities = function findEntities(req) {
  return req.params.namespace ? queryNamespace(req) : queryEntities(req);
};

var createEntity = exports.createEntity = function createEntity(req, res) {
  return req.body instanceof Array ? createCollection(req, res) : createOneEntity(req, res);
};