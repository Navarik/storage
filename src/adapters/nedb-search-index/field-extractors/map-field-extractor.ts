import { SchemaField } from "../../../types"

export class MapFieldExtractor {
  private root

  constructor({ root }) {
    this.root = root
  }

  async extract(field: SchemaField<{ values: SchemaField }>, body: object, id: string) {
    const content = body[field.name]
    for (const key of Object.keys(content)) {
      await this.root.extract(field.parameters.values, content[key], id)
    }
  }
}
