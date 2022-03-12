import { Dictionary, Logger } from "@navarik/types"
import { CanonicalSchema, ValidationResponse, StorageInterface, UUID, CanonicalEntity, Observer, SearchOptions, ChangeEvent, EntityPatch, EntityData, StorageConfig, GetOptions, SearchQuery } from "./types"
import { AvroSchemaEngine } from "@navarik/avro-schema-engine"
import { ConflictError } from "./errors/conflict-error"
import { ValidationError } from "./errors/validation-error"
import { Changelog } from "./changelog"
import { DataLink } from "./data-link"
import { Schema } from "./schema"
import { State } from "./state"

import { CreateAction } from "./actions/create-action"
import { UpdateAction } from "./actions/update-action"
import { DeleteAction } from "./actions/delete-action"

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
  private staticData: Array<ChangeEvent<any, MetaType>>
  private schema: Schema<MetaType>
  private state: State<MetaType>
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

  // Change event factories
  private actions: {
    create: CreateAction<MetaType>
    update: UpdateAction<MetaType>
    delete: DeleteAction<MetaType>
  }

  constructor(config: StorageConfig<MetaType> = {}) {
    const { schema = [], data = [], cacheSize = 100000 } = config

    this.logger = config.logger || defaultLogger
    this.logger.info({ component: "Storage" }, `Initializing storage (cache size: ${cacheSize}, static schemas: ${schema.length}, static data: ${data.length})`)

    const metaSchema = {
      name: "metadata",
      fields: config.meta || []
    }

    const accessControl = config.accessControl || new DefaultAccessControl()
    const searchIndex = config.index || new NeDbSearchIndex<MetaType>({ logger: this.logger })

    this.state = new State<MetaType>({
      logger: this.logger,
      index: searchIndex,
      registry: config.state || new SearchBasedEntityRegistry<MetaType>({ searchIndex }),
      accessControl,
      metaSchema,
      cacheSize
    })

    this.dataLink = new DataLink({
      state: this.state
    })

    this.schema = new Schema({
      schemaEngine: config.schemaEngine || new AvroSchemaEngine(),
      schemaRegistry: config.schemaRegistry || new InMemorySchemaRegistry(),
      idGenerator: config.schemaIdGenerator || new UuidV5IdGenerator({ root: defaultSchemaIdNamespace }),
      dataLink: this.dataLink,
      state: this.state,
      metaSchema
    })

    this.changelog = new Changelog<MetaType>({
      adapter: config.changelog || new DefaultChangelogAdapter(),
      logger: this.logger,
      accessControl,
      observer: this.onChange.bind(this)
    })

    this.actions = {
      create: new CreateAction({ schema: this.schema }),
      update: new UpdateAction({ schema: this.schema }),
      delete: new DeleteAction({ schema: this.schema })
    }

    // Static schema definitions if there is any
    schema.forEach(this.define.bind(this))

    // Static data is used primarily for automated tests
    this.staticData = data.map(document =>
      this.actions.create.request(document, nobody)
    )
  }

  private async onChange<B extends object>(event: ChangeEvent<B, MetaType>) {
    await this.state.update(event)

    if (this.isUp) {
      this.logger.debug({ component: "Storage" }, `Notifying observers on change event for entity ${event.entity.id}`)
      this.observers.forEach(async (observer) => {
        try {
          await observer(event)
        } catch (error: any) {
          this.logger.error({ component: "Storage", stack: error.stack }, `Error notifying observer of change event: ${error.message}`)
        }
      })
    }
  }

  async up() {
    await this.state.up()
    for (const staticEntity of this.staticData) {
      await this.state.update(staticEntity)
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

  validate<BodyType extends object>(entity: EntityData<BodyType, MetaType>): ValidationResponse {
    return this.schema.validate(entity.type, entity.body, entity.meta)
  }

  async has(id: UUID): Promise<boolean> {
    return this.state.has(id)
  }

  async get<BodyType extends object>(id: UUID, { hydrate = false }: GetOptions = {}, user: UUID = nobody): Promise<CanonicalEntity<BodyType, MetaType> | undefined> {
    const entity = await this.state.get<BodyType>(id, user)
    if (!entity) {
      return undefined
    }

    return hydrate
      ? this.dataLink.hydrate(entity, user)
      : entity
  }

  async find<BodyType extends object>(query: SearchQuery|Dictionary<any>, options: SearchOptions = {}, user: UUID = nobody): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    const { limit = 1000, offset = 0, sort = ["created_date:desc", "id:asc"], hydrate = false } = options
    const collection = await this.state.find<BodyType>(query, { offset, limit, sort }, user)

    if (!hydrate) {
      return collection
    }

    return Promise.all(collection.map(entity => this.dataLink.hydrate(entity, user)))
  }

  async count(query: SearchQuery|Dictionary<any>, user: UUID = nobody): Promise<number> {
    return this.state.count(query, user)
  }

  async create<BodyType extends object>(data: EntityData<BodyType, MetaType>, user: UUID = nobody): Promise<CanonicalEntity<BodyType, MetaType>> {
    this.healthStats.totalCreateRequests++

    if (data.id && (await this.has(data.id))) {
      throw new ConflictError(`Entity ${data.id} already exists.`)
    }

    const changeEvent = this.actions.create.request(data, user)
    const referenceValidation = await this.dataLink.validate(changeEvent.entity.type, changeEvent.entity.body, user)
    if (!referenceValidation.isValid) {
      throw new ValidationError(referenceValidation.message)
    }

    return this.changelog.requestChange(changeEvent)
  }

  async update<BodyType extends object>(data: EntityPatch<BodyType, MetaType>, user: UUID = nobody): Promise<CanonicalEntity<BodyType, MetaType>> {
    this.healthStats.totalUpdateRequests++

    const previous = await this.state.get(data.id, user)
    if (!previous) {
      throw new ConflictError(`Update failed: can't find entity ${data.id}`)
    }

    const changeEvent = this.actions.update.request(previous, data, user)
    const referenceValidation = await this.dataLink.validate(changeEvent.entity.type, changeEvent.entity.body, user)
    if (!referenceValidation.isValid) {
      throw new ValidationError(referenceValidation.message)
    }

    return this.changelog.requestChange(changeEvent)
  }

  async delete<BodyType extends object>(id: UUID, user: UUID = nobody): Promise<CanonicalEntity<BodyType, MetaType> | undefined> {
    this.healthStats.totalDeleteRequests++

    const previous = await this.state.get<BodyType>(id, user)
    if (!previous) {
      return undefined
    }

    const changeEvent = this.actions.delete.request(previous, user)

    return this.changelog.requestChange(changeEvent)
  }

  observe<BodyType extends object>(handler: Observer<BodyType, MetaType>) {
    this.observers.push(handler)
  }
}
