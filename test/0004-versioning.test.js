// import expect from 'expect.js'
// import * as entity from '../src'
// import versions from './fixtures/versions.json'

// import { cannotUpdate, canCreate, canUpdate, forAll, canGet, canGetVersion } from './steps'

// describe("Entity versioning", () => {
//   before(() => entity.connect())

//   it("can't update nonexistent entity", cannotUpdate(100, { a: 100, b: 500 }))
//   it("correctly creates first version of entity", canCreate(versions[0]))

//   versions.slice(1).forEach(version =>
//     it(`correctly updates entity to version ${version.version}`, canUpdate(version))
//   )

//   it('specific versions are available individually', canGetVersion({ ...versions[0], id: 1 }))
//   it('specific versions are available individually', forAll(versions.slice(1), canGetVersion))

//   const lastVersion = versions[versions.length - 1]
//   it("can't update if nothing has changed", cannotUpdate(lastVersion))
//   it("only the latest version is available for a given id", canGet(lastVersion))
// })
