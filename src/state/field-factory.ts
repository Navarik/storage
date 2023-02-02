import { Instantiable, Dictionary, SchemaField, SearchableField } from "../types"
import { ArrayField } from "./fields/array-field"
import { MapField } from "./fields/map-field"
import { ObjectField } from "./fields/object-field"
import { PrimitiveField } from "./fields/primitive-field"
import { ReferenceField } from "./fields/reference-field"
import { UnionField } from "./fields/union-field"

export class FieldFactory {
  private typeFactories: Dictionary<Instantiable<SearchableField>> & { other: Instantiable<SearchableField> } = {
    array: ArrayField,
    map: MapField,
    object: ObjectField,
    union: UnionField,
    reference: ReferenceField,
    other: PrimitiveField
  }

  create(field: SchemaField) {
    const FieldClass = this.typeFactories[field.type] || this.typeFactories.other
    const descriptor = new FieldClass(this, field)

    return descriptor
  }
}
