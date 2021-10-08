import { FieldExtractor, SchemaField } from "../../types"

export class ArrayFieldExtractor implements FieldExtractor {
  private root: FieldExtractor

  constructor(root: FieldExtractor) {
    this.root = root
  }

  extract(field: SchemaField<{ items: SchemaField }>, rootPath: Array<string>) {
    return this.root.extract(field.parameters.items, [...rootPath, field.name, "*"])
  }
}
