import { Dictionary } from "@navarik/types"
import { Readable } from "stream"
import { SearchQuery, StorageInterface, StreamOptions } from "./types"

interface Config<M extends object> {
  storage: StorageInterface<M>
  query: SearchQuery|Dictionary<any>
  options: StreamOptions
  user: string
}

export class QueryStream<M extends object> extends Readable {
  private storage: StorageInterface<M>
  private query: SearchQuery|Dictionary<any>
  private options: StreamOptions
  private user: string
  private offset: number = 0

  constructor({ storage, options, query, user }: Config<M>) {
    super({ objectMode: true })
    this.storage = storage
    this.query = query
    this.options = options
    this.user = user
  }

  async _read(size: number) {
    const options = {
      limit: size,
      offset: this.offset,
      sort: this.options.sort,
      hydrate: this.options.hydrate
    }

    const collection = await this.storage.find(this.query, options, this.user)
    if (collection.length) {
      collection.map(x => this.push(x))
    } else {
      this.push(null)
    }

    this.offset += size
  }
}
