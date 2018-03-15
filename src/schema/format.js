import groupBy from 'group-by'

const collect = (formatter, data = []) =>
  data.reduce((acc, item) => acc.concat([formatter(item)]), [])

const field = data => ({
  name: data.name,
  type: data.datatype,
  description: data.description || ''
})

export const formatCollection = data =>
  Object.values(groupBy(data, 'type_name'))
    .map(x => ({
      name: x[0].type_name,
      namespace: x[0].type_namespace,
      version: x[0].type_version,
      description: x[0].type_description || '',
      type: 'record',
      fields: x[0].id !== null ? collect(field, x) : []
    }))

export const formatObject = data => ({
  name: data.name,
  namespace: data.namespace,
  version: data.version || 1,
  description: data.description || '',
  type: 'record',
  fields: data.fields || []
})
