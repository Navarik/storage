import { StorageInterface, StorageConfig } from '../../src'
import { nullLogger } from "../fixtures/null-logger"
import { createSteps } from "../steps/validation"

export const validationStrings = (createStorage: <T extends object = {}>(config: StorageConfig<T>) => StorageInterface<T>) => {

  const storage = createStorage({
    schema: [
      {
        "name": "doge",
        "fields": [
          { name: "wow", type: "string" }
        ]
      },
      {
        "name": "doge_required",
        "fields": [
          { name: "wow", type: "string", required: true }
        ]
      }
    ],
    logger: nullLogger
  })

  const { isValid, isInvalid } = createSteps(storage)

  describe('Primitive type support: string', () => {
    before(() => storage.up())

    it("should support strings", () => {
      isValid({ type: 'doge', body: { wow: null }})
      isValid({ type: 'doge', body: { wow: "" }})
      isValid({ type: 'doge', body: { wow: '2020-03-05T19:29:52.867Z' }})
      isValid({ type: 'doge', body: { wow: 'doge' }})
      isValid({ type: 'doge', body: { wow: '1.34' }})

      isInvalid({ type: 'doge', body: { wow: new Date() }})
      isInvalid({ type: 'doge', body: { wow: true }})
      isInvalid({ type: 'doge', body: { wow: 123 }})
      isInvalid({ type: 'doge', body: { wow: 15.35 }})
      isInvalid({ type: 'doge', body: { wow: ['doge', 'approve'] }})
      isInvalid({ type: 'doge', body: { wow: [{ such_int: 123, much_bool: true }, { such_int: 456, much_bool: false }] }})
    })

    it("should support required strings", () => {
      isValid({ type: 'doge_required', body: { wow: "" }})
      isValid({ type: 'doge_required', body: { wow: '2020-03-05T19:29:52.867Z' }})
      isValid({ type: 'doge_required', body: { wow: 'doge' }})
      isValid({ type: 'doge_required', body: { wow: '1.34' }})

      isInvalid({ type: 'doge_required', body: { wow: null }})
      isInvalid({ type: 'doge_required', body: { wow: new Date() }})
      isInvalid({ type: 'doge_required', body: { wow: true }})
      isInvalid({ type: 'doge_required', body: { wow: 123 }})
      isInvalid({ type: 'doge_required', body: { wow: 15.35 }})
      isInvalid({ type: 'doge_required', body: { wow: ['doge', 'approve'] }})
      isInvalid({ type: 'doge_required', body: { wow: [{ such_int: 123, much_bool: true }, { such_int: 456, much_bool: false }] }})
    })

    after(() => storage.down())
  })
}
