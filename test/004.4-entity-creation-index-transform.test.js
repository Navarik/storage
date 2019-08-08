import expect from 'expect.js'
import createStorage from '../src'
import fixtureSchemata from './fixtures/schemata/schemata.json'
import { expectEntity } from './steps/checks'
import generateConfig from './config/adapter-list'
import logger from '../src/logger'

const entityTransform = (entity) => ({
  ...entity,
  body: {
    role: entity.body.role,
    last_name: entity.body.last_name,
    first_name: entity.body.first_name,
    company: '**********',
    newField: '**********'
  }
})

const invalidEntityTransform = () => {
  throw new Error('test invalid entity transform')
}

const run = config => {
  // expand default to allow for entityTransform option
  if (config.index === 'default') {
    config.index = {
      description: 'default',
      schema: 'default',
      entity: 'default'
    }
  }

  let storage = null
  const type = 'profile.user';
  const body = {
    role: "Doge",
    last_name: "Such",
    first_name: "Much",
    company: "Alpha Oil Co",
    email: "lking@test.abc"
  };

  describe(`Entity index transform, index type [${config.index.description || config.index}]`, () => {
    before(() => {
      // add entityTransform option to index config
      config = {
        ...config,
        index: {
          ...config.index,
          entityTransform
        }
      }

      storage = createStorage({
        schema: fixtureSchemata,
        ...config
      })

      storage.init()
    })

    after(() => {
      if (config.index.cleanup) {
        return config.index.cleanup()
      }
    })

    it("can create with transform and return with transformed entity", async () => {
      // write entity to changelog.
      const entity = await storage.create(type, body)
      expectEntity(entity)
      expect(entity.type).to.eql(type)
      expect(entity.version).to.eql(1)
      expect(entity.body).to.eql(body)

      // read from local-state / searchIndex, which should return the transformed entity
      const document = await storage.get(entity.id)
      expectEntity(document)
      expect(document.type).to.eql(type)
      expect(document.version).to.eql(1)
      expect(document.body).to.eql(entityTransform(entity).body)
    })
  })

  describe(`Entity index transform with invalid transform, index type [${config.index.description || config.index}]`, () => {
    before(() => {
      config = {
        ...config,
        index: {
          ...config.index,
          entityTransform: invalidEntityTransform
        }
      }

      storage = createStorage({
        schema: fixtureSchemata,
        // set level to fatal to ignore expected error logged by invalid transform
        logger: logger.child({ level: 'fatal' }),
        ...config
      })

      storage.init()
    })

    after(() => {
      if (config.index.cleanup) {
        return config.index.cleanup()
      }
    })

    it("should ignore transformation if any error is encountered during transformation", async () => {
      const entity = await storage.create(type, body)
      expectEntity(entity)
      expect(entity.type).to.eql(type)
      expect(entity.version).to.eql(1)
      expect(entity.body).to.eql(body)

      const document = await storage.get(entity.id)
      expectEntity(document)
      expect(document.type).to.eql(type)
      expect(document.version).to.eql(1)
      expect(document.body).to.eql(body)
    })
  })
}

generateConfig().forEach(c => run(c))
