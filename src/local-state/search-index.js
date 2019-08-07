import objectPath from 'object-path'
import map from 'poly-map'
import { maybe } from '../utils'

const stringifyProperties = maybe(value => (
  typeof value === 'object'
    ? value instanceof RegExp
      ? value
      : map(stringifyProperties, value)
    : String(value)
))

const stringifyContent = value => (
  (typeof value === 'object' && value !== null)
    ? Object.values(value).reduce((acc, next) => acc + stringifyContent(next), '')
    : String(value || '')
)

const searchableFormat = (idField, document) => ({
  ...map(stringifyProperties, document.body),
  ___content: stringifyContent(document.body),
  id: objectPath.get(document, idField),
  version: String(document.version),
  version_id: document.version_id,
  type: document.type,
  ___document: document,
})

class SearchIndex {
  constructor(adapter, idField) {
    this.adapter = adapter
    this.idField = idField
  }

  async reset() {
    await this.adapter.connect()
    await this.adapter.reset()
  }

  isConnected() {
    return this.adapter.isConnected()
  }

  async add(document) {
    const searchable = searchableFormat(this.idField, document)
    const current = await this.adapter.find({ id: searchable.id })
    if (current.length) {
      await this.adapter.update({ id: searchable.id }, searchable)
    } else {
      await this.adapter.insert([searchable])
    }
  }

  async find(params, options) {
    const query = map(stringifyProperties, params)
    const results = await this.adapter.find(query, options)

    return results
  }

  async findContent(text, options) {
    const regex = (text instanceof RegExp) ? text : new RegExp(text, 'gi')

    const query = this.adapter.supportsRegex ? { ___content: { $regex: regex } } :
      { $where: function () { return this.___content.match(regex) !== null } }

    const results = await this.adapter.find(query, options)

    return results
  }

  async count(query) {
    return this.adapter.count(query)
  }
}

export default SearchIndex
