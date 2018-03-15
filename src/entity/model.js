import map from 'poly-map'
import sql from 'sql'
import { query, exec, lastInsertedId } from '../adapters/db'
import { head } from '../utils'

const entities = sql.define({
  name: 'entities',
  columns: ['id']
})

const versions = sql.define({
  name: 'versions',
  columns: ['id', 'entity_id', 'version', 'type', 'is_deleted', 'is_latest']
})

const properties = sql.define({
  name: 'properties',
  columns: ['id', 'version_id', 'attribute', 'value']
})

const condition = (field, value) => (value instanceof Array
  ? field.in(value)
  : field.equals(value)
)

export const search = params => {
  const statement = properties
    .select(properties.star(), versions.type, versions.version, versions.entity_id)
    .from(versions
      .leftJoin(properties).on(properties.version_id.equals(versions.id))
    )

  for (let name in params) {
    if (name === 'id') {
      statement.and(versions.entity_id.equals(params[name]))
    } else if (versions[name]) {
      statement.and(condition(versions[name], params[name]))
    } else {
      statement.and(versions.id.in(
        properties.select(properties.version_id)
        .where(properties.attribute.equals(name)
          .and(condition(properties.value, params[name]))
        )
      ))
    }
  }

  return query(statement.toQuery())
}

const fields = body => {
  const result = []

  for (let name in body) {
    if (!['type', 'id', 'version'].includes(name)) {
      result.push({ name, value: body[name] })
    }
  }

  return result
}

export const createVersion = body =>
  exec(versions.insert({
    entity_id: body.id,
    type: body.type || 'entity',
    version: body.version
  }).toQuery())
  .then(version_id => fields(body).reduce((chain, field) =>
    chain.then(() => exec(
      properties.insert({
        version_id,
        attribute: field.name,
        value: field.value
      }).toQuery()))
    , Promise.resolve())
  )
  .then(() => body)

export const create = body =>
  exec(entities.insert({}).toQuery())
    .then(entityId => createVersion({ ...body, version: 1, id: entityId }))

export const deprecate = params =>
  exec(versions.update({ is_latest: 0 })
    .where(versions.entity_id.equals(params.id))
    .toQuery()
  )
  .then(() => params)
