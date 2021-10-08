import { FieldExtractor, SchemaField } from "../../types"

export class ObjectFieldExtractor implements FieldExtractor {
  private root: FieldExtractor

  constructor(root: FieldExtractor) {
    this.root = root
  }

  extract(field: SchemaField<{ fields: Array<SchemaField> }>, rootPath: Array<string>) {
    const path = [...rootPath, field.name]
    let nestedFields = []

    for (const nestedField of field.parameters.fields) {
      nestedFields = nestedFields.concat(this.root.extract(nestedField, path))
    }

    return nestedFields
  }
}
