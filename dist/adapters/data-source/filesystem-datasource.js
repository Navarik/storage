'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _filesystem = require('./filesystem');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FilesystemDatasourceAdapter = function () {
  function FilesystemDatasourceAdapter(config) {
    _classCallCheck(this, FilesystemDatasourceAdapter);

    this.format = config.format;
  }

  _createClass(FilesystemDatasourceAdapter, [{
    key: 'readAllFiles',
    value: function readAllFiles(location) {
      return Promise.resolve((0, _filesystem.readAllFiles)(location.pathname, this.format));
    }
  }]);

  return FilesystemDatasourceAdapter;
}();

exports.default = FilesystemDatasourceAdapter;