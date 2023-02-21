import { SchemaEngine, CanonicalSchema } from '../types'
import { ValidationError } from "../errors/validation-error"

interface Config {
  id: string
  engine: SchemaEngine
  definition: CanonicalSchema
}

export class SchemaType {
  public id: string
  public type: string
  private definition: CanonicalSchema
  private engine: SchemaEngine

  constructor({ id, engine, definition }: Config) {
    this.id = id
    this.type = definition.name
    this.engine = engine
    this.definition = definition
  }

  format<B extends object>(data: Partial<B>) {
    const { isValid, message } = this.engine.validate(this.id, data)
    if (!isValid) {
      throw new ValidationError(message)
    }

    return this.engine.format<B>(this.id, data)
  }

  canonical() {
    return { ...this.definition }
  }
}
