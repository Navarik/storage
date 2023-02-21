import { Formatter } from "./types"

export class JsonlogFormatter implements Formatter<object> {
  fileExtension: string = 'jsonl'

  format(event) {
    return JSON.stringify(event)
  }

  parse(string) {
    return JSON.parse(string)
  }
}