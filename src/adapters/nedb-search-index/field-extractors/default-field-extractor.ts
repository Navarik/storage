import { SchemaField } from "../../../types"

export class DefaultFieldExtractor {
  private callback

  constructor({ callback }) {
    this.callback = callback
  }

  async extract({ name, type }: SchemaField, body: object, id: string) {
    if (type === "text") {
      await this.callback(id, body[name])
    }
  }
}
