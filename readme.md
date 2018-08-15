# Storage

Dynamic entity storage

## Features
- Versioning
- Avro-style schema enforcement
- Observable change events
- Configurable adapters

## Installation
```bash
npm install @navarik/storage
```

## Configuration
There are several ways a storage instance can be constructed. It is also possible to have multiple storage instances simultaneously within your application. Here are the main configuration setups with their respective use-cases.

#### Fully static setup
The storage instance always boots up from exactly the same externally controlled state. Ideal for test automation or as a source of static read-only reference data.

```javascript
import createStorage from '@navarik/storage'

const storage = createStorage({
  schema: [ ...list of pre-defined schemas... ],
  data: [ ...list of pre-defined data objects (including their metadata portions)... ]
})

storage.init()
```

Note, that with this setup it is still possible to create schemas or entities, however these changes will not survive the application restart since the storage will be re-initialized from the static configuration each time `storage.init()` is called.

#### Static schema setup
Empty storage instance with pre-defined schemas. Entity persistance guarantee depends entirely on the provided entity changelog adapter. This setup most closely resembles classical RDBMS in the fact that schema changes would require code re-deployment and data changes would not.

```javascript
import createStorage from '@navarik/storage'

const storage = createStorage({
  schema: [ ...list of pre-defined schemas... ],
  log: {
    schema: 'default',
    entity: myChangelogAdapterInstance
  }
})

storage.init()
```

#### Fully dynamic setup
Both, entity and schema persistance guarantee depends entirely on the given changelog adapter. The instance starts completely empty. Useful for multi-tenant services or user-controlled structured data storages.

```javascript
import createStorage from '@navarik/storage'

const storage = createStorage({
  log: myChangelogAdapterInstance
})

storage.init()
```

## Usage
```javascript
import createStorage from '@navarik/storage'

const storage = createStorage()
storage.init()

async function main() {
  const schema = await storage.createSchema({
    name: 'test',
    fields: [
      { name: 'name', type: 'string' },
      { name: 'says', type: 'string' }
    ]
  })

  const entity = await storage.create('test', { name: 'doge', says: 'wow!' })

  console.log(entity)
}

main()
```

## API
#### Factory & Configuration
Storage library's only export is factory function that is designed to generate storage instances based on provided configuration. Here are the configuratino options:
  `schema: Array<Object>` - provide static schemata in a form of an array of Avro-compatible schema definition JS objects.
  `entity: Array<Object>` - provide static entities in a form of an array of JS objects.
  `log: 'default'|ChangeLogAdapter` - global override for the change-log adapter
  `log.schema: 'default'|ChangeLogAdapter` - override for the schema change-log adapter
  `log.entity: 'default'|ChangeLogAdapter` - override for the entity change-log adapter
  `index: 'default'|SearchIndexAdapter` - global override for the local state's search   `index.schema: 'default'|SearchIndexAdapter` - override for the schema search index adapter
  `index.entity: 'default'|SearchIndexAdapter` - override for the entity search index adapter

#### Instance API
  `init(): Promise<void>` - initialize storage instance, read change-logs, re-generate search index. Usually this method is called once before any other API functions could be accessed.

  `isConnected(): boolean` - returns true if all the adapters are connected and operational, false otherwize. Default in-memory adapters are always connected.

#### Schema management
  `getSchema: (name: string, [version: integer]): Promise<Schema>` - returns schema for a given type name, undefined if no schema is found. Returns a specific version of the schema if `version` argument is provided, uses the latest version by default.

  `findSchema(filter: Object, [options: Object]): Promise<Array<Schema>>` - looks for schemas that match provided filter. Supported search options: limit, offset. Returns empty array if there is no schemas matching the filter.

  `schemaNames(): Array<string>` - returns a list of all registered entity types.

  `createSchema(body: Object): Promise<Schema>` - registers new schema

  `updateSchema(name: string, body: Object): Promise<Schema>` - updates existing schema

#### Entity management
  `get(id: string, [version: number, options = {}]): Promise<Entity>` - fetches a single entity by its unique ID. Fetches a particular version if version argument is provided, otherwise uses the latest known version. Supported options: view ('brief' or 'canonical').

  `find(filter: Object, options: Object): Promise<Array<Entity>>` - search for entities that match given filter. Supported search options: limit, offset, view ('brief' or 'canonical').

  `findContent(text: string, options: Object): Promise<Array<Entity>>` - search for all the entities that have at least one field where the value includes given text. Supported options: view ('brief' or 'canonical').

  `count(filter: Object): Promise<number>` - count the number of entities satisfying the given filter.

  `create(type: string, body: Object, options: Object): Promise<Entity>` - create a new entity of a given type. Supported options: view ('brief' or 'canonical').

  `create(type: string, body: Array<Object>, options: Object): Promise<Array<Entity>>` - bulk-create new entities of a given type. Supported options: view ('brief' or 'canonical').

  `update(id: string, body: Object, options: Object): Promise<Entity>` - update existing entity. Supported options: view ('brief' or 'canonical').

  `validate(type: string, body: Object): string` - validates given object against the schema of a given type and returns a string of discovered errors. Returns empty string.

  `isValid(type: string, body: Object): boolean` - validates given object against the schema of a given type and returnd 'true' if the object is valid and 'false' otherwise.

  `observe(handler: (Entity) => void, [filter: Object]): void` - give the system a callback to envoke on each entity change event. Optionally sets the filter allowing to trigger the callback only for matching entities.

