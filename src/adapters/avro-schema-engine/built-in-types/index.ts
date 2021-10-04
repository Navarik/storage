import { DatetimeType } from "./datetime"
import { ReferenceType } from "./reference"
import { TextType } from "./text"
import { UrlType } from "./url"
import { AnyType } from "./any"

export const builtInTypes = {
  datetime: DatetimeType,
  reference: ReferenceType,
  text: TextType,
  url: UrlType,
  any: AnyType
}
