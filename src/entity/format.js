import groupBy from 'group-by'

export const formatCollection = data =>
  Object.values(groupBy(data, 'entity_id'))
    .map(x => x.reduce((acc, item) => (item.attribute
      ? ({ ...acc, [item.attribute]: item.value })
      : acc
    ), {
      id: Number(x[0].entity_id),
      type: x[0].type,
      version: Number(x[0].version)
    }))

export const formatObject = data => ({
  ...data,
  id: Number(data.id),
  type: data.type || 'entity',
  version: Number(data.version)
})
