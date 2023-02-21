import { CanonicalSchema, StorageInterface } from "../../src"
import { Step } from "../test-runner"
import { findSchema } from "./find-schema"

export const defineSchema: Step = (schema: CanonicalSchema, context: { storage: StorageInterface<any> }) => {
  context.storage.define(schema)

  return findSchema(schema, context)
}
