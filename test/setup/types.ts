import { Storage, StorageConfig } from '../../src'

declare global {
  function createStorage<MetaType extends object>(config: StorageConfig<MetaType>) : Storage<MetaType>;
}
