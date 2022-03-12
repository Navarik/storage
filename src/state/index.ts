import { Dictionary, Logger } from "@navarik/types"
import { CanonicalSchema, SearchIndex, EntityRegistry, CanonicalEntity, ChangeEvent, SearchOptions, SearchQuery, SchemaField, SearchableField, AccessControlAdapter } from "../types"
import { AccessError } from "../errors/access-error"
import { FieldFactory } from "./field-factory"
import { Compiler } from "./compiler"
import { RegistryWithCache } from "./registry-with-cache"

interface Config<M extends object> {
  logger: Logger
  index: SearchIndex<M>
  registry: EntityRegistry<M>
  metaSchema: CanonicalSchema
  accessControl: AccessControlAdapter<M>
  cacheSize: number
}

export class State<MetaType extends object> {
  private logger: Logger
  private cachedRegistry: EntityRegistry<MetaType>
  private metaSchema: CanonicalSchema
  private index: SearchIndex<MetaType>
  private accessControl: AccessControlAdapter<MetaType>
  private searchSchema: SearchableField
  private fieldFactory: FieldFactory
  private compiler: Compiler
  private healthStats = {
    totalSearchQueries: 0,
    totalCountQueries: 0,
    totalIdLookups: 0
  }

  constructor({ logger, index, registry, metaSchema, accessControl, cacheSize }: Config<MetaType>) {
    this.logger = logger
    this.metaSchema = metaSchema
    this.accessControl = accessControl
    this.index = index
    this.cachedRegistry = new RegistryWithCache({ cacheSize, registry })

    this.fieldFactory = new FieldFactory()
    this.searchSchema = this.fieldFactory.create({
      name: "",
      type: "object",
      parameters: { fields: [
        { name: "id", type: "uuid" },
        { name: "version_id", type: "uuid" },
        { name: "previous_version_id", type: "uuid" },
        { name: "created_by", type: "uuid" },
        { name: "created_at", type: "datetime" },
        { name: "modified_by", type: "uuid" },
        { name: "modified_at", type: "datetime" },
        { name: "type", type: "string" },
        { name: "schema", type: "uuid" },
        { name: "body", type: "object", parameters: { fields: [] } },
        { name: "meta", type: "object", parameters: { fields: [] } }
      ] }
    })

    this.compiler = new Compiler({ searchSchema: this.searchSchema })

    this.registerFields("meta", metaSchema.fields)
  }

  private async compileQuery(query: SearchQuery|Dictionary<any>, user: string) {
    const aclTerms = await this.accessControl.getQuery(user, "search")
    const secureQuery = { operator: "and", args: [aclTerms, query] }

    return this.compiler.compile(secureQuery)
  }

  registerFields(branch: string, fields: Array<SchemaField>) {
    if (!fields) {
      return
    }

    this.searchSchema.chain({ name: branch, type: "object", parameters: { fields } })
  }

  async update<B extends object>(event: ChangeEvent<B, MetaType>) {
    this.logger.debug({ component: "Storage" }, `Processing "${event.action}" change event event for entity ${event.entity.id}`)

    if (event.action === "delete") {
      await this.cachedRegistry.delete(event.entity.id)
    } else {
      await this.cachedRegistry.put(event.entity)
    }

    await this.index.update(event.action, event.entity, event.schema, this.metaSchema)
  }

  async has(id: string): Promise<boolean> {
    return this.cachedRegistry.has(id)
  }

  async get<BodyType extends object>(id: string, user: string): Promise<CanonicalEntity<BodyType, MetaType> | undefined> {
    this.healthStats.totalIdLookups++

    const entity = await this.cachedRegistry.get<BodyType>(id)
    if (!entity) {
      return undefined
    }

    const access = await this.accessControl.check(user, "read", entity)
    if (!access.granted) {
      throw new AccessError(access.explanation)
    }

    return entity
  }

  async find<BodyType extends object>(query: SearchQuery|Dictionary<any>, options: SearchOptions, user: string): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    this.healthStats.totalSearchQueries++
    return this.index.find<BodyType>(await this.compileQuery(query, user), options)
  }

  async count(query: SearchQuery|Dictionary<any>, user: string): Promise<number> {
    this.healthStats.totalCountQueries++
    return this.index.count(await this.compileQuery(query, user))
  }

  async isClean() {
    const [registryClean, indexClean] = await Promise.all([
      this.cachedRegistry.isClean(),
      this.index.isClean()
    ])

    return registryClean && indexClean
  }

  async up() {
    await this.cachedRegistry.up()
    await this.index.up()
  }

  async down() {
    await this.index.down()
    await this.cachedRegistry.down()
  }

  async isHealthy() {
    const [registryHealth, indexHealth] = await Promise.all([
      this.cachedRegistry.isHealthy(),
      this.index.isHealthy()
    ])

    return registryHealth && indexHealth
  }

  async stats() {
    return {
      ...this.healthStats,
      state: await this.cachedRegistry.stats(),
      searchIndex: await this.index.stats()
    }
  }
}
