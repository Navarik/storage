import { FieldExtractor, SchemaField } from "../../types"

export class MapFieldExtractor implements FieldExtractor {
  private root: FieldExtractor

  constructor(root: FieldExtractor) {
    this.root = root
  }

  extract(field: SchemaField<{ values: SchemaField }>, rootPath: Array<string>) {
    return this.root.extract(field.parameters.values, [...rootPath, field.name, "*"])
  }
}
