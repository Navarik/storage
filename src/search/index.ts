import { FieldExtractor, SearchIndex, CanonicalEntity, SearchOptions, SearchQuery, CanonicalSchema } from "../types"
import { CompositeFieldExtractor } from "./field-extractor"
import { FieldRegistry } from "./field-registry"

export class Search<MetaType extends object> {
  private searchIndex: SearchIndex<MetaType>
  private fields: FieldRegistry = new FieldRegistry()
  private fieldExtractor: FieldExtractor = new CompositeFieldExtractor()

  constructor({ index }) {
    this.searchIndex = index
  }

  registerSchema(schema: CanonicalSchema) {
    for (const field of schema.fields) {
      const queryMap = this.fieldExtractor.extract(field, ["body"])
      for (const mappedField of queryMap) {
        this.fields.register(mappedField.path, {
          schemaName: schema.name,
          type: mappedField.field.type,
          parameters: mappedField.field.parameters
        })
      }
    }
  }

  async find<BodyType extends object>(query: SearchQuery|{}, options: SearchOptions = {}): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    const collection = await this.searchIndex.find<BodyType>(query, options)

    return collection
  }

  async count(query: SearchQuery|{}): Promise<number> {
    console.log(query["args"])

    const count = this.searchIndex.count(query)

    return count
  }
}
