import { SchemaField } from "../../../types"

export class DefaultFieldExtractor {
  private callback

  constructor({ callback }) {
    this.callback = callback
  }

  async extract({ name, type }: SchemaField, body: any, { id, key }) {
    if (body === undefined || body === null) {
      return
    }

    if (type === "text") {
      const data = name ? body[name] : body
      const uniqueKey = name ? `${key}.${name}` : key
      await this.callback(uniqueKey, id, data)
    }
  }
}
