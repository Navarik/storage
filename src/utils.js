import pipe from 'function-pipe'
import map from 'poly-map'
import exclude from 'poly-exclude'
import curry from 'curry'
import objectPath from 'object-path'
import unique from 'array-unique'
import { diff } from 'deep-object-diff'
import flatten from 'array-flatten'
import sort from 'array-sort'

export const isPlainObject = value => (value && value.constructor && value.constructor.name === 'Object')
export const indexBy = curry((f, xs) => xs.reduce((acc, x) => ({ ...acc, [f(x)]: x }), {}))
export const head = xs => xs && Object.values(xs)[0]
export const empty = x => Object.keys(x).length === 0
export const maybe = f => x => (x === undefined ? undefined : f(x))
export const enforceArray = x => (x instanceof Array ? x : [x])
export const get = curry((path, data) => objectPath.get(data, path))
const liftToArray = func => x => (x instanceof Array ? map(func, x) : func(x))

export { unique, diff, map, flatten, exclude, curry, pipe, liftToArray, sort }
