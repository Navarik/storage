import unique from 'array-unique'
import exclude from 'poly-exclude'
import flatten from 'array-flatten'
import * as entityModel from '@navarik/entity-core'
import * as schemaModel from '@navarik/schema-core'
import { conflictError, badRequestError, created } from './utils'
import format from './format'

const queryEntities = req => entityModel
  .find(req.params)
  .then(data => Promise
    .all(unique(data.map(x => x.type)).map(schemaModel.get))
    .then(schema => ({ data, schema }))
  )

const queryNamespace = req => schemaModel
  .find({ namespace: req.params.namespace })
  .then(schemata => Promise
    .all(schemata.map(x => entityModel
      .find({
        ...exclude(['namespace'], req.params),
        type: `${req.params.namespace}.${x.name}`
      })
    ))
    .then(flatten)
    .then(data => ({ data, schema: data.length ? schemata : [] }))
  )

export const findEntities = req => (req.params.namespace
  ? queryNamespace(req)
  : queryEntities(req)
)

export const getEntity = (req, res) => entityModel
  .get(req.params.id, req.params.v)
  .then(data => (data !== undefined
    ? schemaModel.get(data.type).then(schema => ({ data, schema }))
    : undefined
  ))

export const createEntity = (req, res) => Promise.resolve(req.body)
  .then(body => (!body.type
    ? badRequestError(res, 'No type specified')
    : schemaModel.get(body.type)
      .then(schema => (!schema
        ? badRequestError(res, `Schema not found for type: ${body.type}`)
        : entityModel.create(format(schema, body))
          .then(data => ({ data, schema }))
          .then(created(res))
          .catch(conflictError(res))
        )
      )
    )
  )

export const updateEntity = (req, res) => entityModel
  .get(req.params.id)
  .then(old => (!old
    ? undefined
    : schemaModel.get(req.body.type || old.type)
      .then(schema => (!schema
        ? badRequestError(res, `Schema not found for type: ${req.body.type || old.type}`)
        : entityModel.update(req.params.id, format(schema, req.body))
          .then(data => ({ data, schema }))
          .catch(badRequestError(res))
        )
      )
    )
  )
