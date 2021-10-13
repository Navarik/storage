import { SchemaField } from "../../../types"

export class UnionFieldExtractor {
  private callback

  constructor({ callback }) {
    this.callback = callback
  }

  async extract({ name, parameters }: SchemaField<{ options: Array<string> }>, body: object, id: string) {
    if (parameters.options.includes("text") && typeof body[name] === "string") {
      await this.callback(id, body[name])
    }
  }
}
