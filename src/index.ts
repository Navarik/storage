import { Logger } from "@navarik/types"
import { CanonicalSchema, ValidationResponse, StorageInterface, AccessControlAdapter, EntityRegistry, SearchIndex, UUID, CanonicalEntity, Observer, SearchOptions, ChangeEvent, EntityPatch, EntityData, StorageConfig } from "./types"
import { AvroSchemaEngine } from "@navarik/avro-schema-engine"
import { ConflictError } from "./errors/conflict-error"
import { AccessError } from "./errors/access-error"
import { ValidationError } from "./errors/validation-error"
import { Changelog } from "./changelog"
import { DataLink } from "./data-link"
import { Schema } from "./schema"
import { Search } from "./search"

import { CreateAction } from "./actions/create-action"
import { UpdateAction } from "./actions/update-action"
import { DeleteAction } from "./actions/delete-action"

import { UuidV5IdGenerator } from "./adapters/uuid-v5-id-generator"
import { CachedSearchEntityRegistry } from "./adapters/cached-search-entity-registry"
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
  private search: Search<MetaType>
  private dataLink: DataLink
  private accessControl: AccessControlAdapter<MetaType>
  private currentState: EntityRegistry<MetaType>
  private searchIndex: SearchIndex<MetaType>
  private changelog: Changelog<MetaType>
  private observers: Array<Observer<any, MetaType>>
  private logger: Logger
  private healthStats = {
    upSince: new Date(),
    totalIdLookups: 0,
    totalSearchQueries: 0,
    totalCountQueries: 0,
    totalCreateRequests: 0,
    totalUpdateRequests: 0,
    totalDeleteRequests: 0
  }
  private isUp: boolean

  // Change event factories
  private actions: {
    create: CreateAction<MetaType>
    update: UpdateAction<MetaType>
    delete: DeleteAction<MetaType>
  }

  constructor(config: StorageConfig<MetaType> = {}) {
    const { accessControl, changelog, index, schemaRegistry, state, schemaEngine, schemaIdGenerator, meta = [], schema = [], data = [], cacheSize = 5000000, logger } = config

    this.isUp = false
    this.logger = logger || defaultLogger
    this.logger.debug({ component: "Storage" }, `Initializing storage (cache size: ${cacheSize}, static schemas: ${schema.length}, static data: ${data.length})`)

    this.observers = []

    this.accessControl = accessControl || new DefaultAccessControl()
    this.searchIndex = index || new NeDbSearchIndex({ logger: this.logger })
    this.currentState = state || new CachedSearchEntityRegistry({
      cacheSize,
      searchIndex: this.searchIndex
    })

    this.dataLink = new DataLink({
      state: this.currentState
    })

    this.search = new Search({
      index: this.searchIndex
    })

    this.schema = new Schema({
      schemaEngine: schemaEngine || new AvroSchemaEngine(),
      schemaRegistry: schemaRegistry || new InMemorySchemaRegistry(),
      idGenerator: schemaIdGenerator || new UuidV5IdGenerator({ root: defaultSchemaIdNamespace }),
      dataLink: this.dataLink,
      search: this.search,
      metaSchema: {
        name: "metadata",
        fields: meta
      }
    })

    this.changelog = new Changelog<MetaType>({
      adapter: changelog || new DefaultChangelogAdapter(),
      logger: this.logger,
      accessControl: this.accessControl,
      observer: this.onChange.bind(this)
    })

    this.actions = {
      create: new CreateAction({ schema: this.schema }),
      update: new UpdateAction({ schema: this.schema }),
      delete: new DeleteAction({ schema: this.schema })
    }

    this.search.registerFields("meta", meta)

    // Static schema definitions if there is any
    schema.forEach(this.define.bind(this))

    // Static data is used primarily for automated tests
    this.staticData = data.map(document =>
      this.actions.create.request(document, "Static data loaded", nobody)
    )
  }

  private async updateState<B extends object>(event: ChangeEvent<B, MetaType>) {
    this.logger.debug({ component: "Storage" }, `Processing "${event.action}" change event event for entity ${event.entity.id}`)

    if (event.action === "delete") {
      await this.currentState.delete(event.entity.id)
    } else {
      await this.currentState.put(event.entity)
    }

    const entityWithAcl = await this.accessControl.attachTerms(event.entity)
    await this.searchIndex.update(event.action, entityWithAcl, event.schema, this.schema.metaSchema)
  }

  private async onChange<B extends object>(event: ChangeEvent<B, MetaType>) {
    await this.updateState(event)

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
    await this.searchIndex.up()
    for (const staticEntity of this.staticData) {
      await this.updateState(staticEntity)
    }

    if (!(await this.searchIndex.isClean())) {
      await this.changelog.readAll()
    } else {
      await this.changelog.up()
    }

    this.isUp = true
  }

  async down() {
    await this.changelog.down()
    await this.searchIndex.down()

    this.isUp = false
  }

  async isHealthy() {
    if (!this.isUp) {
      return false
    }

    const [changelogHealth, indexHealth, stateHealth] = await Promise.all([
      this.changelog.isHealthy(),
      this.searchIndex.isHealthy(),
      this.currentState.isHealthy()
    ])

    return changelogHealth && indexHealth && stateHealth
  }

  async stats() {
    const cacheStats = await this.currentState.stats()
    const changelogStats = await this.changelog.stats()

    return {
      ...this.healthStats,
      ...cacheStats,
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
    const entityExists = await this.currentState.has(id)

    return entityExists
  }

  async get<BodyType extends object>(id: UUID, user: UUID = nobody): Promise<CanonicalEntity<BodyType, MetaType> | undefined> {
    this.healthStats.totalIdLookups++

    const entity = await this.currentState.get<BodyType>(id)
    if (!entity) {
      return undefined
    }

    const access = await this.accessControl.check(user, "read", entity)
    if (!access.granted) {
      throw new AccessError(access.explanation)
    }

    return entity
  }

  async find<BodyType extends object>(query: object, options: SearchOptions = {}, user: UUID = nobody): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    this.healthStats.totalSearchQueries++

    const aclTerms = await this.accessControl.getQuery(user, "search")
    const collection = await this.search.find<BodyType>({ operator: "and", args: [aclTerms, query] }, options)

    return collection
  }

  async count(query: object, user: UUID = nobody): Promise<number> {
    this.healthStats.totalCountQueries++

    const aclTerms = await this.accessControl.getQuery(user, "search")
    const count = this.search.count({ operator: "and", args: [aclTerms, query] })

    return count
  }

  async create<BodyType extends object>(data: EntityData<BodyType, MetaType>, commitMessage: string = "", user: UUID = nobody): Promise<CanonicalEntity<BodyType, MetaType>> {
    this.healthStats.totalCreateRequests++

    if (data.id && (await this.has(data.id))) {
      throw new ConflictError(`Entity "${data.id}" already exists.`)
    }

    const changeEvent = this.actions.create.request(data, commitMessage, user)
    const referenceValidation = await this.dataLink.validate(changeEvent.entity.type, changeEvent.entity.body)
    if (!referenceValidation.isValid) {
      throw new ValidationError(referenceValidation.message)
    }

    const transaction = this.changelog.requestChange(changeEvent)

    return transaction
  }

  async update<BodyType extends object>(data: EntityPatch<BodyType, MetaType>, commitMessage: string = "", user: UUID = nobody): Promise<CanonicalEntity<BodyType, MetaType>> {
    this.healthStats.totalUpdateRequests++

    const previous = await this.currentState.get(data.id)
    if (!previous) {
      throw new ConflictError(`Update failed: can't find entity "${data.id}".`)
    }

    const changeEvent = this.actions.update.request(previous, data, commitMessage, user)
    const referenceValidation = await this.dataLink.validate(changeEvent.entity.type, changeEvent.entity.body)
    if (!referenceValidation.isValid) {
      throw new ValidationError(referenceValidation.message)
    }

    const transaction = this.changelog.requestChange(changeEvent)

    return transaction
  }

  async delete<BodyType extends object>(id: UUID, commitMessage: string = "", user: UUID = nobody): Promise<CanonicalEntity<BodyType, MetaType> | undefined> {
    this.healthStats.totalDeleteRequests++

    const previous = await this.currentState.get<BodyType>(id)
    if (!previous) {
      return undefined
    }

    const changeEvent = this.actions.delete.request(previous, commitMessage, user)
    const transaction = this.changelog.requestChange(changeEvent)

    return transaction
  }

  observe<BodyType extends object>(handler: Observer<BodyType, MetaType>) {
    this.observers.push(handler)
  }
}
