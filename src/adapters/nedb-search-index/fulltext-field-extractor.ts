import { SchemaField } from "../../types"
import { ArrayFieldExtractor } from "./field-extractors/array-field-extractor"
import { DefaultFieldExtractor } from "./field-extractors/default-field-extractor"
import { MapFieldExtractor } from "./field-extractors/map-field-extractor"
import { ObjectFieldExtractor } from "./field-extractors/object-field-extractor"
import { UnionFieldExtractor } from "./field-extractors/union-field-extractor"

export class FullTextFieldExtractor {
  private extractors

  constructor({ callback }) {
    this.extractors = {
      "array": new ArrayFieldExtractor({ root: this }),
      "map": new MapFieldExtractor({ root: this }),
      "object": new ObjectFieldExtractor({ root: this }),
      "union": new UnionFieldExtractor({ callback }),
      "other": new DefaultFieldExtractor({ callback })
    }
  }

  async extract(field: SchemaField, body: object, { id, key }) {
    const extractor = this.extractors[field.type] || this.extractors.other
    const result = await extractor.extract(field, body, { id, key })

    return result
  }
}
