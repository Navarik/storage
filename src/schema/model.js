import map from 'poly-map'
import sql from 'sql'
import { query, exec, lastInsertedId } from '../adapters/db'
import { head } from '../utils'

const types = sql.define({
  name: 'schema_types',
  columns: ['id', 'version', 'namespace', 'name', 'description', 'is_latest', 'is_deleted']
})

const attributes = sql.define({
  name: 'schema_attributes',
  columns: ['id', 'type_id', 'name', 'datatype', 'description']
})

const condition = (field, value) => (value instanceof Array
  ? field.in(value)
  : field.equals(value)
)

export const search = params => {
  const statement = types
    .select(
      attributes.star(),
      types.is_latest,
      types.name.as('type_name'),
      types.namespace.as('type_namespace'),
      types.version.as('type_version'),
      types.description.as('type_description')
    )
    .from(types
      .leftJoin(attributes).on(attributes.type_id.equals(types.id))
    )

  for (let name in params) {
    if (!types[name]) {
      throw new Error(`Unknown field: ${name}`)
    }

    statement.and(condition(types[name], params[name]))
  }

  statement.order(attributes.id)

  return query(statement.toQuery())
}

export const allNamespaces = () =>
  query(types.select(types.namespace).from(types).group(types.namespace).toQuery())
    .then(xs => xs.map(x => x.namespace))

export const create = body =>
  exec(
    types.insert({
      name: body.name,
      namespace: body.namespace,
      description: body.description,
      version: body.version || 1
    }).toQuery())
    .then(typeId => body.fields && body.fields.reduce((chain, attribute) =>
      chain.then(() => exec(
        attributes.insert({
          name: attribute.name,
          datatype: attribute.type,
          description: attribute.description,
          type_id: typeId
        }).toQuery()
      ))
    , Promise.resolve()))
    .then(() => body)

export const deprecate = params =>
  exec(types.update({ is_latest: 0 })
    .where(types.name.equals(params.name))
    .and(types.namespace.equals(params.namespace))
    .toQuery()
  )
  .then(() => params)
