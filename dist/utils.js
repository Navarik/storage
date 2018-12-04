'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var maybe = exports.maybe = function maybe(f) {
  return function (x) {
    return x === undefined || x === null ? x : f(x);
  };
};
var head = exports.head = function head(xs) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = xs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var x = _step.value;
      return x;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
};
var liftToArray = exports.liftToArray = function liftToArray(f) {
  return function (x) {
    return x instanceof Array ? x.map(f) : f(x);
  };
};

/**
 * Translate an array of sort queries to pairs that can more easily be tested
 * or be further translated into NeDB's expected format. Example:
 * sortQueries parameter: [ 'vessels:asc', 'foo.bar.baz:desc', ... ]
 * return value:          [ ['vessels', 1], ['foo.bar.baz', -1], ...]
 * @param {string|string[]} sortQueries - A single sort query string or an array of sort query strings in descending priority.
 * @returns {Array<Array>} - An array of one or more [string, number] pairs where string is the field to be sorted by and number is either 1 for ascending sorting or -1 for descending sorting.
 */
var convertSortQueriesToPairs = exports.convertSortQueriesToPairs = function convertSortQueriesToPairs(sortQueries) {
  // Convert sortQueries to an array if it is singular.
  sortQueries = sortQueries.constructor !== Array ? [sortQueries] : sortQueries;
  // Translate an array of sort queries to an array of [string, number] pairs.
  var arrayOfSorts = Array();
  sortQueries.forEach(function (sortQuery) {
    var sortPieces = sortQuery.split(':');
    var sortField = sortPieces.shift();
    var sortOrder = sortPieces.includes('desc') ? -1 : 1;
    arrayOfSorts.push([sortField, sortOrder]);
  });
  return arrayOfSorts;
};