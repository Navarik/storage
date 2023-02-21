import { expect } from "chai"
import { Step } from "../test-runner"

export const findType: Step = (type: string, context) => {
  const types = context.storage.types()
  expect(types).to.be.an("array").to.include(type)

  const definition = context.storage.describe(type)

  expect(definition).to.be.an("object")
  expect(definition).to.have.keys(["name", "fields"])
  expect(definition.name).to.be.a("string")
  expect(definition.fields).to.be.a("array")

  return definition
}
