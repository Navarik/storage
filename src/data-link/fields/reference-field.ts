import { ValidatableField, EntityRegistry } from "../../types"

interface Config {
  path: string
  state: EntityRegistry<any>
}

export class ReferenceField implements ValidatableField {
  private name: string
  private state: EntityRegistry<any>

  constructor({ state, path }: Config) {
    this.name = path
    this.state = state
  }

  async validate(value: any) {
    if (!await this.state.has(value)) {
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
}
