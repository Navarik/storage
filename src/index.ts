import { Dictionary, Logger } from "@navarik/types"
import { CanonicalSchema, StorageInterface, UUID, CanonicalEntity, EntityEnvelope, Observer, SearchOptions, EntityPatch, EntityData, StorageConfig, GetOptions, SearchQuery, AccessControlAdapter, AccessType } from "./types"
import { AvroSchemaEngine } from "@navarik/avro-schema-engine"
import { v4 as uuidv4 } from 'uuid'
import { ConflictError } from "./errors/conflict-error"
import { AccessError } from "./errors/access-error"
import { Changelog } from "./changelog"
import { DataLink } from "./data-link"
import { Schema } from "./schema"
import { State } from "./state"
import { Entity } from "./entity"

import { UuidV5IdGenerator } from "./adapters/uuid-v5-id-generator"
import { SearchBasedEntityRegistry } from "./adapters/search-based-entity-registry"
import { NeDbSearchIndex } from "./adapters/nedb-search-index/index"
import { DefaultAccessControl } from "./adapters/default-access-control"
import { DefaultChangelogAdapter } from "./adapters/default-changelog"
import { InMemorySchemaRegistry } from "./adapters/in-memory-schema-registry"
import { defaultLogger } from "./adapters/default-logger"

export * from "./types"

const nobody = "00000000-0000-0000-0000-000000000000"
const defaultSchemaIdNamespace = '00000000-0000-0000-0000-000000000000'

export class Storage<MetaType extends object> implements StorageInterface<MetaType> {
  private staticData: Array<EntityData<any, MetaType>>
  private schema: Schema<MetaType>
  private state: State<MetaType>
  private accessControl: AccessControlAdapter<MetaType>
  private dataLink: DataLink
  private changelog: Changelog<MetaType>
  private observers: Array<Observer<any, MetaType>> = []
  private logger: Logger
  private healthStats = {
    upSince: new Date(),
    totalCreateRequests: 0,
    totalUpdateRequests: 0,
    totalDeleteRequests: 0
  }
  private isUp: boolean = false

  constructor(config: StorageConfig<MetaType> = {}) {
    const { schema = [], data = [], cacheSize = 100000 } = config

    this.logger = config.logger || defaultLogger
    this.logger.info({ component: "Storage" }, `Initializing storage (cache size: ${cacheSize}, static schemas: ${schema.length}, static data: ${data.length})`)

    const metaSchema = {
      name: "metadata",
      fields: config.meta || []
    }

    this.accessControl = config.accessControl || new DefaultAccessControl()

    this.dataLink = new DataLink({
      state: this
    })

    const searchIndex = config.index || new NeDbSearchIndex<MetaType>({ logger: this.logger })

    this.state = new State<MetaType>({
      logger: this.logger,
      index: searchIndex,
      registry: config.state || new SearchBasedEntityRegistry<MetaType>({ searchIndex }),
      metaSchema,
      cacheSize
    })

    this.schema = new Schema({
      schemaEngine: config.schemaEngine || new AvroSchemaEngine(),
      schemaRegistry: config.schemaRegistry || new InMemorySchemaRegistry(),
      idGenerator: config.schemaIdGenerator || new UuidV5IdGenerator({ root: defaultSchemaIdNamespace }),
      metaSchema,
      onChange: this.onSchemaChange.bind(this)
    })

    this.changelog = new Changelog<MetaType>({
      adapter: config.changelog || new DefaultChangelogAdapter(),
      logger: this.logger,
      observer: this.onDataChange.bind(this)
    })

    // Static schema definitions if there is any
    schema.forEach(this.define.bind(this))

    // Static data is used primarily for automated tests
    this.staticData = data
  }

  private async onSchemaChange(schema: CanonicalSchema) {
    this.state.registerFields("body", schema.fields)
    this.dataLink.registerSchema(schema.name, schema.fields)
  }

  private async onDataChange<B extends object>(entity: CanonicalEntity<B, MetaType>, schema: CanonicalSchema) {
    await this.state.update(entity, schema)

    if (this.isUp) {
      this.logger.debug({ component: "Storage" }, `Notifying observers on change event for entity ${entity.id}`)
      this.observers.forEach(async (observer) => {
        try {
          await observer(entity)
        } catch (error: any) {
          this.logger.error({ component: "Storage", stack: error.stack }, `Error notifying observer of change event: ${error.message}`)
        }
      })
    }
  }

  private async verifyAccess(user: string, access: AccessType, entity: CanonicalEntity<any, MetaType>) {
    const { granted, explanation } = await this.accessControl.check(user, access, entity)
    if (!granted) {
      throw new AccessError(explanation)
    }
  }

  async up() {
    await this.state.up()
    for (const { id = uuidv4(), type, body, meta = {} } of this.staticData) {
      const { entity, schema } = this.schema.format(type, body, meta)
      await this.state.update(entity.create({ id }, nobody), schema)
    }

    if (!(await this.state.isClean())) {
      await this.changelog.readAll()
    } else {
      await this.changelog.up()
    }

    this.isUp = true
  }

  async down() {
    await this.changelog.down()
    await this.state.down()

    this.isUp = false
  }

  async isHealthy() {
    if (!this.isUp) {
      return false
    }

    const [changelogHealth, stateHealth] = await Promise.all([
      this.changelog.isHealthy(),
      this.state.isHealthy()
    ])

    return changelogHealth && stateHealth
  }

  async stats() {
    const stateStats = await this.state.stats()
    const changelogStats = await this.changelog.stats()

    return {
      ...this.healthStats,
      ...stateStats,
      ...changelogStats
    }
  }

  types() {
    return this.schema.types()
  }

  describe(type: string) {
    return this.schema.describe(type)
  }

  define(schema: CanonicalSchema) {
    this.schema.define(schema)
  }

  async has(id: UUID): Promise<boolean> {
    return this.state.has(id)
  }

  async get<BodyType extends object>(id: UUID, { hydrate = false }: GetOptions = {}, user: UUID = nobody): Promise<CanonicalEntity<BodyType, MetaType> | undefined> {
    const entity = await this.state.get<BodyType>(id)
    if (!entity) {
      return undefined
    }

    await this.verifyAccess(user, "read", entity)

    return hydrate
      ? this.dataLink.hydrate(entity, user)
      : entity
  }

  async find<BodyType extends object>(query: SearchQuery|Dictionary<any>, options: SearchOptions = {}, user: UUID = nobody): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    const { limit = 1000, offset = 0, sort = ["created_date:desc", "id:asc"], hydrate = false } = options

    const aclTerms = await this.accessControl.getQuery(user, "search")
    const secureQuery = { operator: "and", args: [aclTerms, query] }

    const collection = await this.state.find<BodyType>(secureQuery, { offset, limit, sort })

    if (!hydrate) {
      return collection
    }

    return Promise.all(collection.map(entity => this.dataLink.hydrate(entity, user)))
  }

  async count(query: SearchQuery|Dictionary<any>, user: UUID = nobody): Promise<number> {
    const aclTerms = await this.accessControl.getQuery(user, "search")
    const secureQuery = { operator: "and", args: [aclTerms, query] }

    return this.state.count(secureQuery)
  }

  async create<BodyType extends object>({ id = uuidv4(), type, body, meta }: EntityData<BodyType, MetaType>, user: UUID = nobody): Promise<EntityEnvelope> {
    this.healthStats.totalCreateRequests++

    if (await this.has(id)) {
      throw new ConflictError(`Entity ${id} already exists.`)
    }

    const { entity, schema } = this.schema.format<BodyType>(type, body, meta || {})
    entity.create({ id }, user)

    await this.verifyAccess(user, 'write', entity)
    await this.dataLink.validate(type, body, user)

    return this.changelog.requestChange("create", entity, schema)
  }

  async update<BodyType extends object>({ id, version_id, type, body, meta }: EntityPatch<BodyType, MetaType>, user: UUID = nobody): Promise<EntityEnvelope> {
    this.healthStats.totalUpdateRequests++
    if (!version_id) {
      throw new ConflictError(`Update unsuccessful due to missing version_id.`)
    }

    const previous = await this.state.get(id)
    if (!previous) {
      throw new ConflictError(`Update failed: can't find entity ${id}`)
    }

    const entity = new Entity(previous).update({ version_id, type, body, meta }, user)
    const formatted = this.schema.format(entity.type, entity.body, entity.meta)

    await this.verifyAccess(user, 'write', entity)
    await this.dataLink.validate(entity.type, entity.body, user)

    return this.changelog.requestChange("update", entity, formatted.schema)
  }

  async delete<BodyType extends object>(id: UUID, user: UUID = nobody): Promise<EntityEnvelope | undefined> {
    this.healthStats.totalDeleteRequests++

    const lastVersion = await this.state.get<BodyType>(id)
    if (!lastVersion) {
      return undefined
    }

    const entity = new Entity(lastVersion).delete(user)
    const schema = this.schema.describeEntity(lastVersion)

    await this.verifyAccess(user, 'write', entity)

    return this.changelog.requestChange("delete", entity, schema)
  }

  observe<BodyType extends object>(handler: Observer<BodyType, MetaType>) {
    this.observers.push(handler)
  }
}
