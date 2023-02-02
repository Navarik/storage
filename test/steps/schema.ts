import { expect } from "chai"
import { StorageInterface, CanonicalSchema } from '../../src'
import { expectCanonicalSchema } from '../checks'

export class SchemaSteps {
  private storage: StorageInterface<any>

  constructor(storage: StorageInterface<any>) {
    this.storage = storage
  }

  canFindType(type: string) {
    const types = this.storage.types()
    expect(types).to.be.an("array").to.include(type)

    const definition = this.storage.describe(type)
    expectCanonicalSchema(definition)

    return definition
  }

  canFindSchema(schema: CanonicalSchema) {
    const definition = this.canFindType(schema.name)
    expect(definition).to.deep.equal(schema)

    return definition
  }

  cannotFindSchema(schema: CanonicalSchema) {
    const definition = this.canFindType(schema.name)
    expect(definition).to.not.deep.equal(schema)

    return definition
  }

  canDefineType(schema: CanonicalSchema) {
    this.storage.define(schema)

    return this.canFindSchema(schema)
  }

  async cannotCreateType(schema: CanonicalSchema) {
    try {
      this.storage.define(schema)
    } catch (err) {
      expect(true).to.equal(true)
      return err
    }

    expect(true).to.equal(false, "Expected error didn't happen")
  }
}
