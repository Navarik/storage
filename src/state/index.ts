import { Logger, Dictionary, CanonicalSchema, SearchIndex, EntityRegistry, CanonicalEntity, SearchOptions, SearchQuery, FieldSchema, SearchableField } from "../types"
import { createField } from "./searchable-fields"
import { Compiler } from "./compiler"
import { RegistryWithCache } from "./registry-with-cache"

interface Config<M extends object> {
  logger: Logger
  index: SearchIndex<M>
  registry: EntityRegistry<M>
  metaSchema: CanonicalSchema
  cacheSize: number
}

export class State<MetaType extends object> {
  private logger: Logger
  private cachedRegistry: EntityRegistry<MetaType>
  private metaSchema: CanonicalSchema
  private index: SearchIndex<MetaType>
  private searchSchema: SearchableField
  private compiler: Compiler
  private healthStats = {
    totalSearchQueries: 0,
    totalCountQueries: 0,
    totalIdLookups: 0
  }

  constructor({ logger, index, registry, metaSchema, cacheSize }: Config<MetaType>) {
    this.logger = logger
    this.metaSchema = metaSchema
    this.index = index
    this.cachedRegistry = new RegistryWithCache({ cacheSize, registry })

    this.searchSchema = createField({
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

  registerFields(branch: string, fields: Array<FieldSchema>) {
    if (!fields) {
      return
    }

    this.searchSchema.chain({ name: branch, type: "object", parameters: { fields } })
  }

  async update<B extends object>(entity: CanonicalEntity<B, MetaType>, schema: CanonicalSchema) {
    this.logger.debug({ component: "Storage" }, `Processing ${entity.last_action} event event for entity ${entity.id}`)

    if (entity.last_action === "delete") {
      await this.cachedRegistry.delete(entity)
    } else {
      await this.cachedRegistry.put(entity)
    }

    await this.index.update(entity.last_action, entity, schema, this.metaSchema)
  }

  async has(id: string): Promise<boolean> {
    if (!id) {
      return false
    }

    return this.cachedRegistry.has(id)
  }

  async history<BodyType extends object>(id: string): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    if (!id) {
      return []
    }

    return this.cachedRegistry.history(id)
  }

  async get<BodyType extends object>(id: string): Promise<CanonicalEntity<BodyType, MetaType> | undefined> {
    this.healthStats.totalIdLookups++
    return this.cachedRegistry.get<BodyType>(id)
  }

  async find<BodyType extends object>(query: SearchQuery|Dictionary<any>, options: SearchOptions): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    this.healthStats.totalSearchQueries++
    return this.index.find<BodyType>(this.compiler.compile(query), options)
  }

  async count(query: SearchQuery|Dictionary<any>): Promise<number> {
    this.healthStats.totalCountQueries++
    return this.index.count(this.compiler.compile(query))
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
      state: this.cachedRegistry.stats && (await this.cachedRegistry.stats()),
      searchIndex: this.index.stats && (await this.index.stats())
    }
  }
}
