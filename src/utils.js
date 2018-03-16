import curry from 'curry'

export const conflictError = curry((res, err) => { res.status(409); return err.message || err })
export const badRequestError = curry((res, err) => { res.status(400); return err.message || err })
export const created = curry((res, result) => { res.status(201); return result })

export const head = xs => xs[0]
export const empty = x => Object.keys(x).length === 0

export const splitName = (separator, string) => {
  const pieces = string.split(separator)
  const name = pieces.pop()
  const namespace = pieces.join(separator)

  return { name, namespace }
}
