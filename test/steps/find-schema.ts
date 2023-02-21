import { expect } from "chai"
import { CanonicalSchema } from "../../src"
import { Step } from "../test-runner"
import { findType } from "./find-type"

export const findSchema: Step = (schema: CanonicalSchema, context) => {
  const definition = findType(schema.name, context)

  expect(definition).to.eql(schema)

  return definition
}
