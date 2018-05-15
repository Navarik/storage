// import expect from 'expect.js'
// import createStorage from '../src'
// import fixtures from './fixtures/data/data.json'
// // import { expectSchema, createSteps } from './steps/schema'

// const storage = createStorage({
//   queue: 'default',
//   index: 'default'
// })

// // const { canCreate, canFind, canUpdate, cannotUpdate } = createSteps(storage)

// const forAll = (given, func) => () => Promise.all(given.map(x => func(x)()))

// export const cannotCreate = given => (done) => {
//   storage.entity.create(given)
//     .then(() => done("Expected error didn't happen"))
//     .catch(() => done())
// }

// export const canCreate = (type, payload) => async () => {
//   const schema = await storage.schema.get(type)
//   const response = await storage.entity.create(given)
//   expectEntity(response, { type, payload })

//   const searchResponse = await storage.schema.findLatest({ name: given.name, namespace: given.namespace })
//   expect(searchResponse).to.be.an('array')
//   expect(searchResponse).to.have.length(1)
//   expect(searchResponse[0].version).to.be(1)
//   expectSchema(searchResponse[0], expected || given)
// }

// describe("Data format", () => {
//   before(() => storage.init())

//   it("can't create entity with id", cannotCreate({ id: 100500 }))
//   // it("allows empty entities", canCreate({}, { type: 'entity', version: 1, id: 1 }))
//   // it("allows entities without fields", canCreate({ type: 'doge' }, { type: 'doge', version: 1, id: 2 }))
// })

// // describe("Entity creation flow", () => {
// //   before(() => storage.init())

// //   it("doesn't have entities before they are created", isEmpty)
// //   it("correctly creates new entities", forAll(fixtures, canCreate))
// //   it("can find created entities", forAll(fixtures, canFindOnlyOne))

// //   it("correct number of entities has been created", async function () {
// //     const response = await entity.find()
// //     expect(response).to.be.an('array')
// //     expect(response).to.have.length(fixtures.length)
// //   })
// // })
