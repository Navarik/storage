import { CanonicalEntity, FieldSchema } from "../../types"
import { DataField } from "../types"
import { isEmpty } from "./utils"

interface State {
  has: (id: string) => Promise<boolean>
  get: (id: string, {}, user: string) => Promise<CanonicalEntity<any, any>|undefined>
}

interface Config {
  path: string
  state: State
  field: FieldSchema<{}>
}

export class ReferenceField implements DataField {
  private name: string
  private state: State
  private required: boolean
  private default: string|null

  constructor({ state, path, field }: Config) {
    this.name = path
    this.state = state
    this.required = field.required || false
    this.default = field.default === undefined ? null : field.default
  }

  async format(data: any = null) {
    const value = data === undefined ? this.default : data

    if (isEmpty(value)) {
      return this.required
        ? { isValid: false, message: `Field ${this.name} cannot be empty.`, value }
        : { isValid: true, message: "", value }
    }

    if (!await this.state.has(value)) {
      return {
        isValid: false,
        message: `Reference document ${value} not found for ${this.name}.`,
        value
      }
    }

    return { isValid: true, message: "", value }
  }

  async hydrate(value: any, user: string) {
    return this.state.get(value, {}, user)
  }
}
