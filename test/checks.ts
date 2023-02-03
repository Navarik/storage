import { expect } from "chai"
import { CanonicalEntity, CanonicalSchema, EntityEnvelope } from "../src"

export const expectEnvelope = (given: EntityEnvelope|undefined) => {
  expect(given).to.be.an("object")
  expect(given).to.have.keys(["type", "id", "version_id", "created_at", "created_by", "modified_at", "modified_by", "previous_version_id", "last_action", "schema"])
  expect(given?.type).to.be.a("string")
  expect(given?.schema).to.be.a("string")
  expect(given?.id).to.be.a("string")
  expect(given?.version_id).to.be.a("string")
  expect(given?.version_id).to.not.be.equal(given?.previous_version_id)
  expect(given?.created_at).to.be.a("string")
  expect(given?.created_by).to.be.a("string")
  expect(given?.modified_at).to.be.a("string")
  expect(given?.modified_by).to.be.a("string")
  expect(given?.last_action).to.be.a("string")
}

export const expectEntity = (given: CanonicalEntity<any, any>|undefined) => {
  expect(given).to.be.an("object")
  expect(given).to.have.keys(["body", "meta", "type", "id", "version_id", "created_at", "created_by", "modified_at", "modified_by", "previous_version_id", "last_action", "schema"])
  expect(given?.type).to.be.a("string")
  expect(given?.schema).to.be.a("string")
  expect(given?.id).to.be.a("string")
  expect(given?.version_id).to.be.a("string")
  expect(given?.version_id).to.not.be.equal(given?.previous_version_id)
  expect(given?.created_at).to.be.a("string")
  expect(given?.created_by).to.be.a("string")
  expect(given?.modified_at).to.be.a("string")
  expect(given?.modified_by).to.be.a("string")
  expect(given?.last_action).to.be.a("string")
  expect(given?.body).to.be.an("object")
  expect(given?.meta).to.be.an("object")
}

export const expectSameEntity = (given: CanonicalEntity<any, any>|undefined, expected: Partial<CanonicalEntity<any, any>>) => {
  expectEntity(given)

  if (expected.type) {
    expect(given?.type).to.eql(expected.type)
  }
  if (expected.id) {
    expect(given?.id).to.eql(expected.id)
  }

  for (const field in expected.body) {
    expect(given?.body[field]).to.deep.eq(expected.body[field])
  }
}

export const expectCanonicalSchema = (given: CanonicalSchema|undefined) => {
  expect(given).to.be.an("object")
  expect(given).to.have.keys(["name", "fields"])
  expect(given?.name).to.be.a("string")
  expect(given?.fields).to.be.a("array")
}
