import server from './adapters/http-server'

const createServer = (controller) => {
  // Healthchecks
  server.addHealthCheck(() => true, 'Imposibiru')

  // Constroller
  const create = handler => async (req, res) => {
    const result = await handler(req.body)
    res.status(201)

    return result
  }

  const update = handler => async (req, res) => {
    const result = await handler(req.params.id, req.body)

    return result
  }

  const read = handler => async (req, res) => {
    const result = await handler(req.params)

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
  server.mount('post', '/entities', create(controller.create))
  server.mount('get', '/entities', read(controller.findLatest))
  server.mount('put', '/entity/:id', update(controller.update))
  server.mount('get', '/entity/:id', read(controller.getLatest))
  server.mount('get', '/entity/:id/versions', read(controller.findVersions))
  server.mount('get', '/entity/:id/version/:version', read(controller.getVersion))
  server.mount('get', '/entity/:id/v/:version', read(controller.getVersion))

  // Connect to databases then start web-server
  return () => server.start(process.env.PORT)
}

export default createServer
