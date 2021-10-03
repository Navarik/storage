import { SchemaEngine, CanonicalSchema, ValidationResponse } from "../types"

export class PermissiveSchemaEngine implements SchemaEngine {
  validate<T>(schema: CanonicalSchema, body: T): ValidationResponse {
    return { isValid: true, message: "" }
  }

  format<T>(schema: CanonicalSchema, body: T): T {
    return body
  }
}
