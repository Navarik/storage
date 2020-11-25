"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeDbQueryParser = void 0;
class NeDbQueryParser {
    parseFilter(searchParams) {
        const filter = {};
        for (const field in searchParams) {
            const value = searchParams[field];
            if (value instanceof Array) {
                filter[field] = { $in: value };
            }
            else if (typeof value === 'object') {
                filter[field] = value;
            }
            else {
                filter[field] = `${value}`;
            }
        }
        return filter;
    }
    /**
      * Translate the array of sort queries from CoreQL format to NeDB cursor.sort() format. Example:
      *    received this:         [ 'vessels:asc', 'foo.bar.baz:desc', ... ]
      *    NeDB wants this:       { vessels: 1 , 'foo.bar.baz': -1, ... }
     * @param {string|string[]} sortQueries - A single sort query string or an array of sort query strings in descending priority.
     * @returns {Array<Array>} - An array of one or more [string, number] pairs where string is the field to be sorted by and number is either 1 for ascending sorting or -1 for descending sorting.
     */
    parseSortQuery(sortQueries) {
        const result = {};
        for (const item of sortQueries) {
            const [field, order] = item.split(':');
            result[field] = (order || '').trim().toLowerCase() === 'desc' ? -1 : 1;
        }
        return result;
    }
}
exports.NeDbQueryParser = NeDbQueryParser;
//# sourceMappingURL=ne-db-query-parser.js.map