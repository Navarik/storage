import { Storage, StorageConfig } from '../../src'

declare global {
  function createStorage<T extends object, M extends object>(config: StorageConfig<M>) : Storage<T>;
}
