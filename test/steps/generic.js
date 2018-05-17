export const forAll = (given, func) => () => Promise.all(given.map((x, i) => func(x, i)()))

export const forNone = (given, func) => (done) => {
  Promise
    .all(given.map((x, i) => func(x, i)()))
    .then(() => done("Expected error didn't happen"))
    .catch(() => done())
}
