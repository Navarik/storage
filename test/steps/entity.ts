import { Dictionary } from "../../src/types"
import { expect } from "chai"
import { EntityPatch, StorageInterface, CanonicalEntity, UUID, EntityData } from '../../src'
import { expectSameEntity, expectEnvelope } from '../checks'

export class EntitySteps {
  private storage: StorageInterface<any>

  constructor(storage: StorageInterface<any>) {
    this.storage = storage
  }

  async canCreate(entity: EntityData<any, any>, user?: UUID) {
    const created = await this.storage.create(entity, user)
    expectEnvelope(created)

    const found = await this.storage.get(created.id)
    expectSameEntity(found, entity)

    expect(await this.storage.count({ id: created.id })).to.equal(1)
    const foundCollection = await this.storage.find({ id: created.id })
    expectSameEntity(foundCollection[0], entity)

    return created
  }

  async cannotCreate(entity: EntityData<any, any>, user?: UUID) {
    try {
      await this.storage.create(entity, user)
    } catch (err: any) {
      expect(true).to.equal(true)
      return err
    }

    expect(true).to.equal(false, "Expected error didn't happen")
  }

  async cannotGet(id: string, user?: UUID) {
    try {
      await this.storage.get(id, {}, user)
    } catch (err: any) {
      expect(true).to.equal(true)
      return
    }

    expect(true).to.equal(false, "Expected error didn't happen")
  }

  async canDelete(id: string) {
    const lastVersion = await this.storage.get(id)

    const response = await this.storage.delete(id)
    expectEnvelope(response)

    expect(await this.storage.get(id)).to.be.undefined

    return lastVersion
  }

  async cannotDelete(id: string, user?: UUID) {
    try {
      await this.storage.delete(id, user)
    } catch (err: any) {
      expect(true).to.equal(true)
      return err
    }

    expect(true).to.equal(false, "Expected error didn't happen")
  }

  async canFind(entity: Partial<CanonicalEntity<any, any>>, user?: UUID) {
    let response

    // Find using fields in a query
    const query: Dictionary<any> = {}
    if (entity.id) query.id = entity.id
    if (entity.type) query.type = entity.type
    if (entity.body) {
      for (const field in entity.body) {
        query[`body.${field}`] = entity.body[field]
      }
    }
    if (entity.meta) {
      for (const field in entity.meta) {
        query[`meta.${field}`] = String(entity.meta[field])
      }
    }

    response = await this.storage.find(query, {}, user)
    expect(response).to.be.an('array')
    expect(response).to.have.length(1)
    expectSameEntity(response[0], entity)

    return response[0]
  }

  async cannotFind(entity: Partial<CanonicalEntity<any, any>>, user?: UUID) {
    let response

    // Find using fields in a query
    const query: Dictionary<any> = {}
    if (entity.id) query.id = entity.id
    if (entity.type) query.type = entity.type
    if (entity.body) {
      for (const field in entity.body) {
        query[`body.${field}`] = String(entity.body[field])
      }
    }
    if (entity.meta) {
      for (const field in entity.meta) {
        query[`meta.${field}`] = String(entity.meta[field])
      }
    }

    response = await this.storage.find(query, {}, user)
    expect(response).to.be.an('array')
    expect(response).to.have.length(0)
  }

  async canUpdate(entity: EntityPatch<any, any>) {
    const response = await this.storage.update(entity)
    expectEnvelope(response)

    // Try to read it back by ID
    const found = await this.storage.get(entity.id)
    expectSameEntity(found, entity)

    return response
  }

  async cannotUpdate(entity: EntityPatch<any, any>) {
    try {
      await this.storage.update(entity)
    } catch (err: any) {
      expect(true).to.equal(true)
      return err
    }

    expect(true).to.equal(false, "Expected error didn't happen")
  }
}
