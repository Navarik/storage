# Storage

Dynamic entity storage

## Features
- Versioning
- Avro-style schema enforcement
- Observable change events
- Configurable adapters

## API
### Instance API
  `init(): Promise<void>` - initialize storage instance, read change-logs, re-generate search index. Usually this method is called once before any other API functions could be accessed.

  `isConnected(): boolean` - returns true if all the adapters are connected and operational, false otherwize. Default in-memory adapters are always connected.

### Schema management
  `getSchema: (name: string, [version: integer]): Promise<Schema>` - returns schema for a given type name, undefined if no schema is found. Returns a specific version of the schema if `version` argument is provided, uses the latest version by default.

  `findSchema(filter: Object, [options: Object]): Promise<Array<Schema>>` - looks for schemas that match provided filter. Supported search options: limit, offset. Returns empty array if there is no schemas matching the filter.

  `schemaNames(): Array<string>` - returns a list of all registered entity types.

  `createSchema(body: Object): Promise<Schema>` - registers new schema

  `updateSchema(name: string, body: Object): Promise<Schema>` - updates existing schema

### Entity management
  `get(id: string, [version: number, options = {}]): Promise<Entity>` - fetches a single entity by its unique ID. Fetches a particular version if version argument is provided, otherwise uses the latest known version. Supported options: view ('brief' or 'canonical').

  `find(filter: Object, options: Object): Promise<Array<Entity>>` - search for entities that match given filter. Supported search options: limit, offset, view ('brief' or 'canonical').

  `findContent(text: string, options: Object): Promise<Array<Entity>>` - search for all the entities that have at least one field where the value includes given text. Supported options: view ('brief' or 'canonical').

  `count(filter: Object): Promise<number>` - count the number of entities satisfying the given filter.

  `create(type: string, body: Object, options: Object): Promise<Entity>` - create a new entity of a given type. Supported options: view ('brief' or 'canonical').

  `create(type: string, body: Array<Object>, options: Object): Promise<Array<Entity>>` - bulk-create new entities of a given type. Supported options: view ('brief' or 'canonical').

  `update(id: string, body: Object, options: Object): Promise<Entity>` - update existing entity. Supported options: view ('brief' or 'canonical').

  `validate(type: string, body: Object): string`

  `isValid(type: string, body: Object): boolean`

  `observe(handler: (Entity) => void, filter: Object): void`

