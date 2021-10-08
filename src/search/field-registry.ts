import { Dictionary } from "@navarik/types"
import { SearchableField } from "../types"

export class FieldRegistry {
  private fields: Dictionary<Array<SearchableField>> = {}

  register(field: Array<string>, descriptor: SearchableField) {
    const path = field.join(".")

    if (!this.fields[path]) {
      this.fields[path] = []
    }

    this.fields[path].push(descriptor)
  }

  resolve(path: Array<string>): Array<SearchableField> {
    return this.fields[path.join(".")] || []
  }
}
