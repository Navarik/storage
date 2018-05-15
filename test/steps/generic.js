export const forAll = (given, func) => () => Promise.all(given.map(x => func(x)()))

export const forNone = (given, func) => (done) => {
  Promise
    .all(given.map(x => func(x)()))
    .then(() => done("Expected error didn't happen"))
    .catch(() => done())
}
