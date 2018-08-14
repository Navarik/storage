'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _objectPath = require('object-path');

var _objectPath2 = _interopRequireDefault(_objectPath);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createListener = function createListener(filter, handler) {
  return function (data) {
    for (var fieldName in filter) {
      if (_objectPath2.default.get(data, fieldName) !== filter[fieldName]) {
        return;
      }
    }

    handler(data);
  };
};

exports.default = createListener;