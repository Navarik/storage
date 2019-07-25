
import { MongoIndexAdapter } from '../../src'
import uuidv4 from 'uuid/v4'

const createMongoAdapter = () => {
  const adapter = new MongoIndexAdapter({
    url: process.env.TEST_MONGO_URL || 'mongodb://localhost:27017',
    db: 'test_db',
    collection: `test_${uuidv4().substr(0, 8)}`,
  })

  return adapter
}

const deleteMongoCollection = adapter => {
  return new Promise(resolve => {
    if (adapter.isConnected()) {
      adapter.collection.drop(() => {
        // console.log(`MongoDB tests: dropped collection [${adapter.config.collection}]`)
        resolve(true)
      })
    } else {
      resolve(false)
    }
  })
}

const generateConfig = () => {
  const configList = [
    { index: 'default' },
  ]

  if ( process.env.TEST_MONGO ) {
    const adapter = createMongoAdapter()

    configList.push({
      index: {
        description: 'mongo-entity',
        schema: 'default',
        entity: adapter,
        cleanup: () => deleteMongoCollection(adapter)
      }
    })
  }

  return configList
}

export default generateConfig
