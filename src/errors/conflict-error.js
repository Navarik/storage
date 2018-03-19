class ConflictError extends Error {
  constructor(...args) {
    super(...args)
    this.code = 409
    Error.captureStackTrace(this, ConflictError)
  }
}

export default ConflictError
