import map from 'poly-map'
import exclude from 'poly-exclude'
import curry from 'curry'
import objectPath from 'object-path'
import unique from 'array-unique'
import { diff } from 'deep-object-diff'
import flatten from 'array-flatten'

export const indexBy = curry((f, xs) => xs.reduce((acc, x) => ({ ...acc, [f(x)]: x }), {}))
export const head = xs => xs && Object.values(xs)[0]
export const empty = x => Object.keys(x).length === 0

export const splitName = (separator, string) => {
  const pieces = string.split(separator)
  const name = pieces.pop()
  const namespace = pieces.join(separator)

  return { name, namespace }
}

export const get = curry((path, data) => objectPath.get(data, path))

export { unique, diff, map, flatten, exclude }
