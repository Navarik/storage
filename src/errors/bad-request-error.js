class BadRequestError extends Error {
  constructor(...args) {
    super(...args)
    this.code = 400
    Error.captureStackTrace(this, BadRequestError)
  }
}

export default BadRequestError
