import { Dictionary } from '@navarik/types';
import { SearchQuery } from '../../types';
export declare class NeDbQueryParser {
    parseFilter(searchParams: Dictionary<any>): SearchQuery;
    /**
      * Translate the array of sort queries from CoreQL format to NeDB cursor.sort() format. Example:
      *    received this:         [ 'vessels:asc', 'foo.bar.baz:desc', ... ]
      *    NeDB wants this:       { vessels: 1 , 'foo.bar.baz': -1, ... }
     * @param {string|string[]} sortQueries - A single sort query string or an array of sort query strings in descending priority.
     * @returns {Array<Array>} - An array of one or more [string, number] pairs where string is the field to be sorted by and number is either 1 for ascending sorting or -1 for descending sorting.
     */
    parseSortQuery(sortQueries: Array<string>): Dictionary<number>;
}
