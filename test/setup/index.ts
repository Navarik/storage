import { Storage, StorageConfig } from '../../src'
import './types'

global.createStorage = function(config: StorageConfig<any>) {
  return new Storage({...config})
}
