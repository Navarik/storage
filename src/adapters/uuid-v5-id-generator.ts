import { v5 as uuidv5 } from 'uuid'
import { IdGenerator } from '../types'

export class UuidV5IdGenerator<T extends object> implements IdGenerator<T> {
  private uuidRoot: string

  constructor({ root }: { root: string }) {
    this.uuidRoot = root
  }

  id(schema: T) {
    return uuidv5(JSON.stringify(schema), this.uuidRoot)
  }
}
