import { FieldExtractor, SchemaField } from "../../types"

export class UnionFieldExtractor implements FieldExtractor {
  private root: FieldExtractor

  constructor(root: FieldExtractor) {
    this.root = root
  }

  extract(field: SchemaField<{ options: Array<SchemaField> }>, rootPath: Array<string>) {
    const path = [...rootPath, field.name]
    let typeOptions = []

    for (const option of field.parameters.options) {
      typeOptions = typeOptions.concat(this.root.extract(option, path))
    }

    return typeOptions
  }
}
