import { SearchIndex, CanonicalEntity, SearchOptions, SearchQuery, SchemaField, SearchableField } from "../types"
import { FieldFactory } from "./field-factory"
import { Compiler } from "./compiler"

export class Search<MetaType extends object> {
  private searchIndex: SearchIndex<MetaType>
  private searchSchema: SearchableField
  private fieldFactory: FieldFactory
  private compiler: Compiler

  constructor({ index }) {
    this.searchIndex = index

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
  }

  registerFields(branch: string, fields: Array<SchemaField>) {
    if (!fields) {
      return
    }

    this.searchSchema.chain({ name: branch, type: "object", parameters: { fields } })
  }

  async find<BodyType extends object>(query: SearchQuery, options: SearchOptions = {}): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    const preparedQuery = this.compiler.compile(query)
    const collection = await this.searchIndex.find<BodyType>(preparedQuery, options)

    return collection
  }

  async count(query: SearchQuery): Promise<number> {
    const preparedQuery = this.compiler.compile(query)
    const count = this.searchIndex.count(preparedQuery)

    return count
  }
}
