import { Dictionary, Instantiable } from "@navarik/types"
import { SchemaField, ValidatableField, EntityRegistry } from "../types"
import { ArrayField } from "./fields/array-field"
import { MapField } from "./fields/map-field"
import { ObjectField } from "./fields/object-field"
import { PrimitiveField } from "./fields/primitive-field"
import { ReferenceField } from "./fields/reference-field"
import { UnionField } from "./fields/union-field"

export class FieldFactory {
  private state: EntityRegistry<any>
  private typeFactories: Dictionary<Instantiable<ValidatableField>> = {
    "array": ArrayField,
    "map": MapField,
    "object": ObjectField,
    "union": UnionField,
    "reference": ReferenceField,
    "other": PrimitiveField
  }

  constructor({ state }) {
    this.state = state
  }

  create(path: string, field: SchemaField) {
    const FieldClass = this.typeFactories[field.type] || this.typeFactories.other
    const descriptor = new FieldClass({ factory: this, state: this.state, path, field })

    return descriptor
  }
}
