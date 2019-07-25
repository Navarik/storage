
import { MongoIndexAdapter } from '../../src'
import uuidv4 from 'uuid/v4'


const generateList = () => {

  return [
    {
      index: 'default',
    },
    {
      index: {
        description: 'mongo-entity',
        schema: 'default',
        entity: new MongoIndexAdapter({
          db: 'test_db',
          collection: `test_${uuidv4().substr(0, 8)}`,
        }),
      }
    }
  ]
}

export default generateList
