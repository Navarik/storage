export const maybe = f => x => (x === undefined || x === null ? x : f(x))
export const head = (xs) => { for (let x of xs) return x }
export const liftToArray = f => x => (x instanceof Array ? x.map(f) : f(x))

// test commit