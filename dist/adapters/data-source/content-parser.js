"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var parsers = {
  json: function json(content) {
    return JSON.parse(content);
  }
};

var parse = function parse(type, content) {
  if (!parsers[type]) {
    throw new Error("Unknown file type: " + type);
  }

  return parsers[type](content);
};

exports.default = parse;