import { SchemaField } from "../../../types"

export class ArrayFieldExtractor {
  private root

  constructor({ root }) {
    this.root = root
  }

  async extract(field: SchemaField<{ items: SchemaField }>, body: object, { id, key }) {
    const content = body[field.name]
    if (content === undefined || content === null) {
      return
    }

    let i = 0
    for (const item of content) {
      i++
      await this.root.extract(field.parameters.items, item, { id, key: `${key}.${i}` })
    }
  }
}
