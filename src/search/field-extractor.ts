import { Dictionary } from "@navarik/types"
import { FieldExtractor, SchemaField } from "../types"
import { ArrayFieldExtractor } from "./type-extractors/array-field-extractor"
import { MapFieldExtractor } from "./type-extractors/map-field-extractor"
import { ObjectFieldExtractor } from "./type-extractors/object-field-extractor"
import { PrimitiveFieldExtractor } from "./type-extractors/primitive-field-extractor"
import { UnionFieldExtractor } from "./type-extractors/union-field-extractor"

export class CompositeFieldExtractor implements FieldExtractor {
  private extractors: Dictionary<FieldExtractor> = {
    "array": new ArrayFieldExtractor(this),
    "map": new MapFieldExtractor(this),
    "object": new ObjectFieldExtractor(this),
    "union": new UnionFieldExtractor(this),
    "other": new PrimitiveFieldExtractor()
  }

  extract(field: SchemaField<{ items: SchemaField }>, rootPath: Array<string>) {
    const extractor = this.extractors[field.type] || this.extractors.other
    return extractor.extract(field, rootPath)
  }
}
