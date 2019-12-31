/**
 * Translate an array of sort queries to pairs that can more easily be tested
 * or be further translated into NeDB's expected format. Example:
 * sortQueries parameter: [ 'vessels:asc', 'foo.bar.baz:desc', ... ]
 * return value:          [ ['vessels', 1], ['foo.bar.baz', -1], ...]
 * @param {string|string[]} sortQueries - A single sort query string or an array of sort query strings in descending priority.
 * @returns {Array<Array>} - An array of one or more [string, number] pairs where string is the field to be sorted by and number is either 1 for ascending sorting or -1 for descending sorting.
 */
export const convertSortQueriesToPairs = (sortQueries) => {
  // Convert sortQueries to an array if it is singular.
  sortQueries = sortQueries.constructor !== Array ? [sortQueries] : sortQueries
  // Translate an array of sort queries to an array of [string, number] pairs.
  const arrayOfSorts = Array()
  sortQueries.forEach( (sortQuery) => {
    const sortPieces = sortQuery.split(':')
    const sortField = sortPieces.shift()
    const sortOrder = sortPieces.includes('desc') ? -1 : 1
    arrayOfSorts.push([sortField, sortOrder])
  });
  return arrayOfSorts
}
