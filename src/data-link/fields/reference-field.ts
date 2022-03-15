import { SchemaField, StorageInterface } from "../../types"
import { DataField } from "../index"

interface Config {
  path: string
  state: StorageInterface<any>
  field: SchemaField<{}>
}

export class ReferenceField implements DataField {
  private name: string
  private state: StorageInterface<any>
  private isRequired: boolean

  constructor({ state, path, field: { required } }: Config) {
    this.name = path
    this.state = state
    this.isRequired = !!required
  }

  async validate(value: any = null, user: string) {
    if (value === null && !this.isRequired) {
      return {
        isValid: true,
        message: ""
      }
    }

    if (this.isRequired && !await this.state.get(value, {}, user)) {
      return {
        isValid: false,
        message: `Reference document "${value}" not found for "${this.name}". `
      }
    }

    return {
      isValid: true,
      message: ""
    }
  }

  async hydrate(value: any, user: string) {
    return this.state.get(value, {}, user)
  }
}
