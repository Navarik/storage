import server from './adapters/http-server'

const createServer = (controller) => {
  const { schemaModel, entityModel } = controller

  // Healthchecks
  server.addHealthCheck(schemaModel.isConnected, 'Schema core down')
  server.addHealthCheck(entityModel.isConnected, 'Entity core down')

  // Constroller
  const create = handler => async (req, res) => {
    const result = await handler(req.body)
    res.status(201)

    return result
  }

  // Mount business logic
  // Schema lists
  server.mount('get', '/schemas',                       controller.findSchemata)
  server.mount('get', '/schemata',                      controller.findSchemata)
  server.mount('get', '/schemas/namespaces',            controller.getNamespaces)
  server.mount('get', '/schemata/namespaces',           controller.getNamespaces)
  server.mount('get', '/schemas/namespace/:namespace',  controller.findSchemata)
  server.mount('get', '/schemata/namespace/:namespace', controller.findSchemata)

  // Schema ID lookups
  server.mount('get', '/schema/:id',                    controller.getSchema)
  server.mount('get', '/schema/:id/versions',           controller.allSchemaVersions)
  server.mount('get', '/schema_version/:vid',           controller.getSchemaVersion)

  // Single Schema search
  server.mount('get', '/schema/:namespace/:name',                  controller.findOneSchema)
  server.mount('get', '/schema/:namespace/:name/versions',         controller.allSchemaVersions)
  server.mount('get', '/schema/:namespace/:name/version/:version', controller.findOneSchema)
  server.mount('get', '/schema/:namespace/:name/v/:version',       controller.findOneSchema)

  // Schema creation/update
  server.mount('post', '/schemas',               controller.createSchema)
  server.mount('post', '/schemata',              controller.createSchema)
  server.mount('put',  '/schema/:id',            controller.updateSchema)

  // Entity management
  server.mount('post', '/entities', create(controller.createEntity))
  server.mount('get',  '/entities',              controller.findEntities)
  server.mount('put',  '/entity/:id',            controller.updateEntity)
  server.mount('get',  '/entity/:id',            controller.getEntity)
  server.mount('get',  '/entity/:id/versions',   controller.allEntityVersions)
  server.mount('get',  '/entity/:id/version/:v', controller.getEntity)
  server.mount('get',  '/entity/:id/v/:v',       controller.getEntity)

  // Connect to databases then start web-server
  return () => server.start(process.env.PORT)
}

export default createServer
