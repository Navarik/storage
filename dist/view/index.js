'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _canonicalEntity = require('./canonical-entity');

var _canonicalEntity2 = _interopRequireDefault(_canonicalEntity);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var entityViews = {
  canonical: _canonicalEntity2.default,
  brief: _canonicalEntity2.default
};

var entityView = function entityView(schemaRegistry) {
  return function (type) {
    return entityViews[type || 'canonical'](schemaRegistry);
  };
};

exports.default = entityView;