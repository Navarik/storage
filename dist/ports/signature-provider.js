'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _v = require('uuid/v5');

var _v2 = _interopRequireDefault(_v);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SignatureProvider = function () {
  function SignatureProvider(generator) {
    _classCallCheck(this, SignatureProvider);

    this.generateId = generator;
  }

  _createClass(SignatureProvider, [{
    key: 'signNew',
    value: function signNew(body) {
      var id = this.generateId(body);
      var version_id = (0, _v2.default)(JSON.stringify(body), id);
      var now = new Date();

      var document = {
        id: id,
        version_id: version_id,
        version: 1,
        created_at: now.toISOString(),
        modified_at: now.toISOString(),
        body: body
      };

      return document;
    }
  }, {
    key: 'signVersion',
    value: function signVersion(body, previous) {
      var id = previous.id;
      var version_id = (0, _v2.default)(JSON.stringify(body), id);
      var now = new Date();

      var document = {
        id: id,
        version_id: version_id,
        version: previous.version + 1,
        created_at: previous.created_at,
        modified_at: now.toISOString(),
        body: body
      };

      return document;
    }
  }]);

  return SignatureProvider;
}();

exports.default = SignatureProvider;