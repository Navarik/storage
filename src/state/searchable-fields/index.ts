import { Instantiable, Dictionary, FieldSchema, SearchableField } from "../../types"
import { ArrayField } from "./array-field"
import { MapField } from "./map-field"
import { ObjectField } from "./object-field"
import { PrimitiveField } from "./primitive-field"
import { ReferenceField } from "./reference-field"
import { UnionField } from "./union-field"

const typeFactories: Dictionary<Instantiable<SearchableField>> = {
  array: ArrayField,
  map: MapField,
  object: ObjectField,
  union: UnionField,
  reference: ReferenceField
}

export const createField = (field: FieldSchema): SearchableField => {
  const FieldClass = typeFactories[field.type] || PrimitiveField
  const descriptor = new FieldClass(field)

  return descriptor
}
