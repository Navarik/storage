// import expect from 'expect.js'
// import schema from './setup'
// import versions from './fixtures/versions.json'

// import { canFindOnlyOne, canCreate, canUpdate } from './steps'

// async function forAll(data, func) {
//   return await Promise.all(data.map(x => func(x)))
// }

// describe("Schema versioning", () => {
//   before(() => schema.connect())

//   it("can't update empty schema", (done) => {
//     schema.update('test', {})
//       .then(() => done("Expected error didn't happen"))
//       .catch(() => done())
//   })

//   it("can't update schema without namespace", (done) => {
//     schema.update('test', { name: 'test' })
//       .then(() => done("Expected error didn't happen"))
//       .catch(() => done())
//   })

//   it("can't update schema if it doesn't exist", (done) => {
//     schema.update('version_test.user', versions[0])
//       .then(() => done("Expected error didn't happen"))
//       .catch(() => done())
//   })

//   it("correctly creates first version of schema", canCreate(versions[0]))

//   versions.slice(1).forEach(version =>
//     it(`correctly updates schema to version ${version.version}`, canUpdate(version))
//   )

//   const lastVersion = versions[versions.length - 1]

//   it("can't update if nothing has changed", (done) => {
//     schema.update(`${lastVersion.namespace}.${lastVersion.name}`, lastVersion)
//       .then(() => done("Expected error didn't happen"))
//       .catch(() => done())
//   })

//   it("only the latest version is available for a given name and namespace", canFindOnlyOne(lastVersion))

//   it('specific versions are available individually', async function () {
//     const responses = await forAll(versions, version => schema.get(`${version.namespace}.${version.name}`, version.version))
//     expect(responses).to.have.length(versions.length)
//     responses.forEach((response, key) => {
//       expect(response).to.be.an('object')
//       expect(response).to.be.eql(versions[key])
//     })
//   })
// })
