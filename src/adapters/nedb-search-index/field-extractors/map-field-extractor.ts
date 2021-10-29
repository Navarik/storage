import { SchemaField } from "../../../types"

export class MapFieldExtractor {
  private root

  constructor({ root }) {
    this.root = root
  }

  async extract(field: SchemaField<{ values: SchemaField }>, body: object, { id, key }) {
    if (body === undefined || body === null) {
      return
    }

    const content = body[field.name]
    for (const index of Object.keys(content)) {
      await this.root.extract(field.parameters.values, content[index], { id, key: `${key}.${index}` })
    }
  }
}
