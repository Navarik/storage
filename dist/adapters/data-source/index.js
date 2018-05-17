'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gitDatasource = require('./git-datasource');

Object.defineProperty(exports, 'GitDatasourceAdapter', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_gitDatasource).default;
  }
});

var _filesystemDatasource = require('./filesystem-datasource');

Object.defineProperty(exports, 'FilesystemDatasourceAdapter', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_filesystemDatasource).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }