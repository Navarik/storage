import { SchemaField } from "../../../types"

export class ObjectFieldExtractor {
  private root

  constructor({ root }) {
    this.root = root
  }

  async extract({ name, parameters }: SchemaField<{ fields: Array<SchemaField> }>, body: object, id: string) {
    const content = body[name]
    if (content === undefined || content === null) {
      return
    }

    for (const field of parameters.fields) {
      await this.root.extract(field, content[field.name], id)
    }
  }
}
