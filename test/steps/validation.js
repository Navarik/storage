import { expect } from 'chai'

export const createSteps = (storage) => ({
  isValid: (document) => {
    const response = storage.validate(document)
    expect(response).to.be.an('object')
    expect(response.isValid).to.be.true
    expect(response.message).to.be.empty
  },

  isInvalid: (document) => {
    const response = storage.validate(document)
    expect(response).to.be.an('object')
    expect(response.isValid).to.be.false
    expect(response.message).to.not.be.empty
  }
})
