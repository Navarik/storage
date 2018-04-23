import uuidv4 from 'uuid/v4'
import { empty, diff } from './utils'
import { BadRequestError } from './errors'
import VersionedStorage from './versioned-storage'

class EntityModel extends VersionedStorage {
  constructor(config) {
    super({
      idGenerator: () => uuidv4(), // Random unique identifier
      ...config
    })
  }

  async update(id, newBody) {
    const found = await this.findOne(id)
    if (!found) {
      throw new BadRequestError(`Entity not found: ${id}`)
    } else if (empty(diff(found, newBody))) {
      throw new BadRequestError(res, 'Versions are identical')
    }

    const data = await super.update(found, newBody)

    return data
  }
}

export default EntityModel
