import { DataField } from "../../types"

interface Config {
  path: string
}

export class AnyField implements DataField {
  public name: string

  constructor({ path }: Config) {
    this.name = path
  }

  async validate() {
    return { isValid: true, message: "" }
  }

  async hydrate(value: any) {
    return value
  }
}
