import { CanonicalSchema } from '../types'

interface Config {
  id: string
  definition: CanonicalSchema
}

export class Schema {
  public id: string
  public type: string
  private definition: CanonicalSchema

  constructor({ id, definition }: Config) {
    this.id = id
    this.type = definition.name
    this.definition = definition
  }

  canonical() {
    return { ...this.definition }
  }
}
