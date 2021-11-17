import { DataField, EntityRegistry, SchemaField } from "../../types"

interface Config {
  path: string
  state: EntityRegistry<any>
  field: SchemaField<{}>
}

export class ReferenceField implements DataField {
  private name: string
  private state: EntityRegistry<any>
  private isRequired: boolean

  constructor({ state, path, field: { required } }: Config) {
    this.name = path
    this.state = state
    this.isRequired = !!required
  }

  async validate(value: any = null) {
    if (value === null && !this.isRequired) {
      return {
        isValid: true,
        message: ""
      }
    }

    if (this.isRequired && !await this.state.has(value)) {
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

  async hydrate(value: any) {
    const referencedDocument = await this.state.get(value)
    return referencedDocument
  }
}
