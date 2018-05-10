// import expect from 'expect.js'
// import schema from './setup'
// import fixtures from './fixtures/schemata.json'

// import { cannotFind, canFindOnlyOne, canCreate, cannotCreate, forAll } from './steps'

// describe("Schema format", () => {
//   before(() => schema.connect())

//   it("can't create empty schema", cannotCreate({}))

//   it("can't create schema without namespace", cannotCreate(
//     { name: 'test', fields: [{ name: 'test_field', type: 'string' }] }
//   ))

//   it("allows schemata without fields and description", canCreate(
//     { name: 'test', namespace: 'test' },
//     {
//       name: 'test',
//       namespace: 'test',
//       description: '',
//       type: 'record',
//       version: 1,
//       fields: []
//     }
//   ))
// })

// describe("Schema creation flow", () => {
//   before(() => schema.connect())

//   it("doesn't have schemata before they are created", forAll(fixtures, cannotFind))

//   it("correctly creates new schemata", forAll(fixtures, canCreate))

//   it("doesn't allow creating duplicates", (done) => {
//     Promise.all(fixtures.map(fixture => schema.create(fixture)
//       .then(() => done("Expected error didn't happen"))
//     )).catch(() => done())
//   })

//   it("has only one schema with given name and namespace", forAll(fixtures, canFindOnlyOne))

//   it("correct number of schemata has been created", async function () {
//     const response = await schema.find()
//     expect(response).to.be.an('array')
//     expect(response).to.have.length(fixtures.length)
//   })

//   it("created namespaces are visible", async function () {
//     const response = await schema.namespaces()
//     fixtures.forEach(fixture => expect(response).to.contain(fixture.namespace))
//   })
// })
