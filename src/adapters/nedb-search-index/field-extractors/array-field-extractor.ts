import { SchemaField } from "../../../types"

export class ArrayFieldExtractor {
  private root

  constructor({ root }) {
    this.root = root
  }

  async extract(field: SchemaField<{ items: SchemaField }>, body: object, id: string) {
    const content = body[field.name]
    if (content === undefined || content === null) {
      return
    }

    for (const item of content) {
      await this.root.extract(field.parameters.items, item, id)
    }
  }
}
