import { Dictionary } from "@navarik/types"
import { expect } from "chai"
import { StorageInterface, UUID, SearchQuery, SearchOptions } from '../../src'
import { expectEntity } from '../checks'

export class SearchSteps {
  private storage: StorageInterface<any>

  constructor(storage: StorageInterface<any>) {
    this.storage = storage
  }

  async canFind<T extends object>(query: SearchQuery|Dictionary<any>, options: SearchOptions = {}, user?: UUID) {
    const response = await this.storage.find<T>(query, options, user)
    expect(response).to.be.an('array')
    expect(response).to.not.be.empty

    response.forEach(expectEntity)

    return response
  }

  async cannotFind(query: SearchQuery|Dictionary<any>, options: SearchOptions = {}, user?: UUID) {
    const response = await this.storage.find(query, options, user)
    expect(response).to.be.an('array')
    expect(response).to.be.empty
  }
}
