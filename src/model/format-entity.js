import curry from 'curry'

const enforceType = (type, value) => {
  switch (type) {
    case 'string':
      return String(value || '')
    case 'number':
      return Number(value || 0)
    default:
      return value
  }
}

const enforceSchema = curry((schema, data) => {
  const result = {
    type: `${schema.namespace}.${schema.name}`
  }

  for (let i in schema.fields) {
    const { name, type } = schema.fields[i]
    result[name] = enforceType(type, data[name])
  }

  return result
})

export default enforceSchema
