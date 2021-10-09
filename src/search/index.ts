import util from "util"
import { FieldExtractor, SearchIndex, CanonicalEntity, SearchOptions, SearchQuery, CanonicalSchema } from "../types"
import { ValidationError } from "../errors/validation-error"
import { CompositeFieldExtractor } from "./field-extractor"
import { FieldRegistry } from "./field-registry"

export class Search<MetaType extends object> {
  private searchIndex: SearchIndex<MetaType>
  private fields: FieldRegistry = new FieldRegistry()
  private fieldExtractor: FieldExtractor = new CompositeFieldExtractor()

  constructor({ index }) {
    this.searchIndex = index
    this.fields.register(["id"], { path: "id", schemaName: "", type: "uuid", parameters: [] })
    this.fields.register(["version_id"], { path: "version_id", schemaName: "", type: "uuid", parameters: [] })
    this.fields.register(["previous_version_id"], { path: "previous_version_id", schemaName: "", type: "uuid", parameters: [] })
    this.fields.register(["created_by"], { path: "created_by", schemaName: "", type: "uuid", parameters: [] })
    this.fields.register(["created_at"], { path: "created_at", schemaName: "", type: "datetime", parameters: [] })
    this.fields.register(["modified_by"], { path: "modified_by", schemaName: "", type: "uuid", parameters: [] })
    this.fields.register(["modified_at"], { path: "modified_at", schemaName: "", type: "datetime", parameters: [] })
    this.fields.register(["type"], { path: "type", schemaName: "", type: "string", parameters: [] })
    this.fields.register(["schema"], { path: "schema", schemaName: "", type: "uuid", parameters: [] })
  }

  private findDescriptor(field: string, value: any) {
    const path = field.split(".")

    const descriptors = this.fields.resolve(path)
    const descriptor = descriptors.find(x => x.type === "reference" || x.type === typeof value)

    return descriptor
  }

  private resolveField(query: SearchQuery) {
    const [ field, value ] = query.args
    const descriptor = this.findDescriptor(field, value)
    if (!descriptor) {
      throw new ValidationError(`Type mismatch for ${field}.`)
    }

    if (descriptor.type === "reference") {
      const nestedField = field.replace(`${descriptor.path}.`, "")
      return {
        operator: "in",
        args: [
          descriptor.path,
          {
            operator: "subquery",
            args: [{
              operator: query.operator,
              args: [nestedField, value]
            }]
          }
        ]
      }
    }

    return query
  }

  private processQuery(query: SearchQuery) {
    if (typeof query !== "object" && query !== null) {
      return query
    }

    if (["eq", "in", "neq", "gt", "lt", "gte", "lte", "not", "like"].includes(query.operator)) {
      return this.resolveField(query)
    }

    return {
      operator: query.operator,
      args: query.args.map(x => this.processQuery(x))
    }
  }

  registerSchema(schema: CanonicalSchema) {
    for (const field of schema.fields) {
      const queryMap = this.fieldExtractor.extract(field, ["body"])
      for (const mappedField of queryMap) {
        this.fields.register(mappedField.path, {
          path: mappedField.path.join("."),
          schemaName: schema.name,
          type: mappedField.field.type,
          parameters: mappedField.field.parameters
        })
      }
    }
  }

  async find<BodyType extends object>(query: SearchQuery, options: SearchOptions = {}): Promise<Array<CanonicalEntity<BodyType, MetaType>>> {
    const collection = await this.searchIndex.find<BodyType>(query, options)

    return collection
  }

  async count(query: SearchQuery): Promise<number> {
    const preparedQuery = this.processQuery(query)

    console.log(util.inspect(preparedQuery, false, 10, true))

    const count = this.searchIndex.count(preparedQuery)

    return count
  }
}
