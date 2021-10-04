import { StorageInterface, StorageConfig } from '../../src'
import { nullLogger } from "../fixtures/null-logger"
import { createSteps } from "../steps/validation"

export const validationInts = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {

  const storage = createStorage({
    schema: [
      {
        "name": "doge",
        "fields": [
          { name: "wow", type: "int" }
        ]
      },
      {
        "name": "doge_required",
        "fields": [
          { name: "wow", type: "int", required: true }
        ]
      }
    ],
    logger: nullLogger
  })

  const { isValid, isInvalid } = createSteps(storage)

  describe('Primitive type support: integers', () => {
    before(() => storage.up())

    it("should support integers", () => {
      isValid({ type: 'doge', body: { wow: null }})
      isValid({ type: 'doge', body: { wow: 123 }})
      isValid({ type: 'doge', body: { wow: 0 }})

      isInvalid({ type: 'doge', body: { wow: new Date() }})
      isInvalid({ type: 'doge', body: { wow: '2020-03-05T19:29:52.867Z' }})
      isInvalid({ type: 'doge', body: { wow: 'doge' }})
      isInvalid({ type: 'doge', body: { wow: true }})
      isInvalid({ type: 'doge', body: { wow: '1010' }})
      isInvalid({ type: 'doge', body: { wow: 15.35 }})
      isInvalid({ type: 'doge', body: { wow: ['doge', 'approve'] }})
      isInvalid({ type: 'doge', body: { wow: [{ wow: 123, much_bool: true }, { wow: 456, much_bool: false }] }})
    })

    it("should support required integers", () => {
      isValid({ type: 'doge_required', body: { wow: 123 }})
      isValid({ type: 'doge_required', body: { wow: 0 }})

      isInvalid({ type: 'doge_required', body: { wow: null }})
      isInvalid({ type: 'doge_required', body: { wow: new Date() }})
      isInvalid({ type: 'doge_required', body: { wow: '2020-03-05T19:29:52.867Z' }})
      isInvalid({ type: 'doge_required', body: { wow: 'doge' }})
      isInvalid({ type: 'doge_required', body: { wow: true }})
      isInvalid({ type: 'doge_required', body: { wow: '1010' }})
      isInvalid({ type: 'doge_required', body: { wow: 15.35 }})
      isInvalid({ type: 'doge_required', body: { wow: ['doge', 'approve'] }})
      isInvalid({ type: 'doge_required', body: { wow: [{ wow: 123, much_bool: true }, { wow: 456, much_bool: false }] }})
    })

    after(() => storage.down())
  })
}
