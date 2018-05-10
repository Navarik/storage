// import expect from 'expect.js'
// import schema from './setup'

// export const forAll = (givens, func) => async function () {
//   return await Promise.all(givens.map(x => func(x)()))
// }

// export const canFindOnlyOne = given => async function () {
//   let response

//   response = await schema.get(`${given.namespace}.${given.name}`)
//   expect(response).to.be.an('object')
//   expect(response).to.eql(given)

//   response = await schema.find({ name: given.name, namespace: given.namespace })
//   expect(response).to.be.an('array')
//   expect(response).to.have.length(1)
//   expect(response[0]).to.eql(given)
// }

// export const cannotFind = given => async function () {
//   let response

//   response = await schema.get(`${given.namespace}.${given.name}`)
//   expect(response).to.be(undefined)

//   response = await schema.find({ name: given.name, namespace: given.namespace })
//   expect(response).to.be.an('array')
//   expect(response).to.be.empty()
// }

// export const canCreate = (given, expected) => async function () {
//   const response = await schema.create(given)
//   expect(response).to.be.an('object')
//   expect(response).to.be.eql(expected || given)
// }

// export const cannotCreate = given => (done) => {
//   schema.create(given)
//     .then(() => done("Expected error didn't happen"))
//     .catch(() => done())
// }

// export const canUpdate = given => async function () {
//   const response = await schema.update(`${given.namespace}.${given.name}`, given)
//   expect(response).to.be.an('object')
//   expect(response).to.be.eql(given)
// }
