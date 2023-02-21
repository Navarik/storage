import { DataField, SchemaField, StorageInterface } from "../../types"
import { isEmpty } from "./utils"

interface Config {
  path: string
  state: StorageInterface<any>
  field: SchemaField<{}>
}

export class ReferenceField implements DataField {
  private name: string
  private state: StorageInterface<any>
  private required: boolean

  constructor({ state, path, field: { required } }: Config) {
    this.name = path
    this.state = state
    this.required = !!required
  }

  async validate(value: any = null, user: string) {
    if (isEmpty(value)) {
      return this.required
        ? { isValid: false, message: `Field ${this.name} cannot be empty.` }
        : { isValid: true, message: "" }
    }

    if (!await this.state.get(value, {}, user)) {
      return {
        isValid: false,
        message: `Reference document ${value} not found for ${this.name}.`
      }
    }

    return { isValid: true, message: "" }
  }

  async hydrate(value: any, user: string) {
    return this.state.get(value, {}, user)
  }
}
