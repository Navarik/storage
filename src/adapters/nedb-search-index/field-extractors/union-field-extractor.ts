import { SchemaField } from "../../../types"

export class UnionFieldExtractor {
  private callback

  constructor({ callback }) {
    this.callback = callback
  }

  async extract({ name, parameters }: SchemaField<{ options: Array<string> }>, body: object, { id, key }) {
    if (body === undefined || body === null) {
      return
    }

    if (parameters.options.includes("text") && typeof body[name] === "string") {
      const data = name ? body[name] : body
      const uniqueKey = name ? `${key}.${name}` : key
      await this.callback(uniqueKey, id, data)
    }
  }
}
