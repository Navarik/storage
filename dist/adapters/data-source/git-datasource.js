'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _simpleGit = require('simple-git');

var _simpleGit2 = _interopRequireDefault(_simpleGit);

var _fileExtension = require('file-extension');

var _fileExtension2 = _interopRequireDefault(_fileExtension);

var _filesystem = require('./filesystem');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CHECKOUT_LOCATION = 'storage_source';

var GitDatasourceAdapter = function () {
  function GitDatasourceAdapter(config) {
    _classCallCheck(this, GitDatasourceAdapter);

    this.workingDirectory = config.workingDirectory;
    this.format = config.format;
    this.git = (0, _simpleGit2.default)(config.workingDirectory);
  }

  _createClass(GitDatasourceAdapter, [{
    key: 'readAllFiles',
    value: function readAllFiles(location) {
      var _this = this;

      (0, _filesystem.clean)(this.workingDirectory);
      var uri = location.protocols[1] + '://' + location.resource + location.pathname;
      var pathname = this.workingDirectory + '/' + CHECKOUT_LOCATION;

      return new Promise(function (resolve, reject) {
        _this.git.clone(uri, CHECKOUT_LOCATION, [], function () {
          resolve((0, _filesystem.readAllFiles)(pathname, _this.format));
        });
      });
    }
  }]);

  return GitDatasourceAdapter;
}();

exports.default = GitDatasourceAdapter;