import expect from 'expect.js'
import createStorage from '../src'
import generateConfig from './config/adapter-list'


const run = config => {
  const storage = createStorage(config)

  describe(`Empty state, index type [${config.index.description || config.index}]`, () => {
    before(() => storage.init())

    it("should have no types", async () => {
      const response = await storage.findSchema()
      expect(response).to.be.an('array')
      expect(response).to.be.empty()
    })

    it("should have no entities", async () => {
      const response = await storage.find()
      expect(response).to.be.an('array')
      expect(response).to.be.empty()
    })
  })
}

generateConfig().forEach(c => run(c))
