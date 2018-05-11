// import expect from 'expect.js'
// import schema from './setup'


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


// export const canUpdate = given => async function () {
//   const response = await schema.update(`${given.namespace}.${given.name}`, given)
//   expect(response).to.be.an('object')
//   expect(response).to.be.eql(given)
// }
