import { FieldExtractor, SchemaField } from "../../types"

export class PrimitiveFieldExtractor implements FieldExtractor {
  extract(field: SchemaField, rootPath: Array<string>) {
    return [({
      path: field.name ? [...rootPath, field.name] : rootPath,
      field
    })]
  }
}
