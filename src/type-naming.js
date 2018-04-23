import { curry } from './utils'

export const split = curry((separator, string) => {
  const pieces = string.split(separator)
  const name = pieces.pop()
  const namespace = pieces.join(separator)

  return { name, namespace }
})

export const combine = curry((separator, object) =>
	[object.namespace, object.name].join(separator)
)
