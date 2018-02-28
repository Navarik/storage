import curry from 'curry'

export const conflictError = curry((res, err) => { res.status(409); return err.message || err })
export const badRequestError = curry((res, err) => { res.status(400); return err.message || err })
export const created = curry((res, result) => { res.status(201); return result })
