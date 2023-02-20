import { StorageInterface } from '../src'
import * as steps from "./steps"
import { TestRunner } from './test-runner'

export const createRunner = (storage: StorageInterface<any>, userId?: string) => {
  const context = { storage, userId }
  const runner = new TestRunner<typeof context, typeof steps>(context, steps)

  return runner
}
