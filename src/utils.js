//@flow
import map from 'poly-map'

type Iterable<T> = { [string|number]: T } | Array<T>

export const maybe = f => x => (x === undefined ? undefined : f(x))

export const head = <T: any>(xs: Iterable<T>): ?T => { for (let x of xs) return x }

export const liftToArray = (func) => x => (x instanceof Array ? map(func, x) : func(x))
