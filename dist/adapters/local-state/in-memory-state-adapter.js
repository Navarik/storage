"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var InMemoryStateAdapter = function () {
  function InMemoryStateAdapter() {
    _classCallCheck(this, InMemoryStateAdapter);

    this.versions = {};
    this.latest = {};
  }

  _createClass(InMemoryStateAdapter, [{
    key: "exists",
    value: function exists(key) {
      return key in this.latest;
    }
  }, {
    key: "set",
    value: function set(key, item) {
      if (!this.versions[key]) {
        this.versions[key] = [];
      }

      this.versions[key].push(item);
      this.latest[key] = item;
    }
  }, {
    key: "get",
    value: function get(key) {
      return this.latest[key];
    }
  }, {
    key: "getVersion",
    value: function getVersion(key, versionNumber) {
      return this.versions[key][versionNumber - 1];
    }
  }, {
    key: "getAll",
    value: function getAll() {
      return this.latest;
    }
  }, {
    key: "reset",
    value: function reset() {
      this.latest = {};
      this.versions = {};
    }
  }]);

  return InMemoryStateAdapter;
}();

exports.default = InMemoryStateAdapter;