//@flow
import map from 'poly-map'

type Maybe<T> = T | typeof undefined
type LiftToMaybe = <A: any, B: any>(f: (A => B)) => (Maybe<A> => Maybe<B>)
export const maybe: LiftToMaybe = f => x => (x === undefined ? undefined : f(x))

type Iterable<T> = { [string|number]: T } | Array<T>
export const head = <T: any>(xs: Iterable<T>): ?T => { for (let x of xs) return x }

export const liftToArray = (func) => x => (x instanceof Array ? map(func, x) : func(x))
