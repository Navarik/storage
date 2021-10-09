import { Dictionary } from "@navarik/types"
import { SearchableField } from "../types"

type Leaf<T> = T
interface Tree<T> extends Dictionary<Leaf<T>|Tree<T>> {}

export class FieldRegistry {
  private fields: Tree<Array<SearchableField>> = {}

  get(object, field, defaultValue) {
    if (!object[field]) {
      object[field] = defaultValue
    }

    return object[field]
  }

  private seek(path: Array<string>) {
    let current: Tree<Array<SearchableField>>|Array<SearchableField> = this.fields
    for (let i = 0; i < path.length - 1; i++) {
      current = this.get(current, path[i], {})

      if (current instanceof Array) {
        return current
      }
    }

    const lastField = path[path.length - 1]

    return this.get(current, lastField, [])
  }

  register(path: Array<string>, descriptor: SearchableField) {
    const field = this.seek(path)
    field.push(descriptor)
  }

  resolve(path: Array<string>): Array<SearchableField> {
    return this.seek(path)
  }
}
