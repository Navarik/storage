'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bunyan = require('bunyan');

var _bunyan2 = _interopRequireDefault(_bunyan);

var _package = require('../package');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = _bunyan2.default.createLogger({
  name: _package2.default.name,
  level: process.env.LOG_LEVEL || 'info'
});

exports.default = logger;