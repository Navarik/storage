import util from "util"
import { SearchIndex, CanonicalEntity, SearchOptions, SearchQuery, CanonicalSchema } from "../types"
import { FieldFactory } from "./field-factory"
import { ObjectField } from "./fields/object-field"
import { Linker } from "./linker"

export class Search<MetaType extends object> {
  private searchIndex: SearchIndex<MetaType>
  private searchSchema: ObjectField
  private fieldFactory: FieldFactory
  private linker: Linker

  constructor({ index }) {
    this.searchIndex = index

    this.fieldFactory = new FieldFactory()
    this.searchSchema = new ObjectField(this.fieldFactory, {
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
        { name: "body", type: "object", parameters: { fields: [] } }
      ] }
    })

    this.linker = new Linker({ searchSchema: this.searchSchema })
  }

  registerSchema(schema: CanonicalSchema) {
    this.searchSchema.chain({ name: "body", type: "object", parameters: { fields: schema.fields } })
  }

  async find<BodyType extends object>(query: SearchQuery, options: SearchOptions = {}): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    const preparedQuery = this.linker.link(query)
    const collection = await this.searchIndex.find<BodyType>(preparedQuery, options)

    return collection
  }

  async count(query: SearchQuery): Promise<number> {
    const preparedQuery = this.linker.link(query)
    console.log(util.inspect(preparedQuery, false, 10, true))

    const count = this.searchIndex.count(preparedQuery)

    return count
  }
}
