import { Dictionary } from "@navarik/types"
import { AccessControlAdapter, CanonicalEntity, AccessControlDecision, UUID, AccessType, SearchQuery } from '../types'

export class DefaultAccessControl implements AccessControlAdapter<CanonicalEntity> {
  async check(subject:UUID, action:AccessType, object:CanonicalEntity): Promise<AccessControlDecision> {
    const granted = object && subject === object.created_by

    return {
      granted,
      explanation: `[DefaultAccessControl]: ${granted ? 'Granted' : 'Denied'} - "${subject}" => "${action}" => "${object && object.id}"`
    }
  }

  async attachTerms(entity: CanonicalEntity): Promise<CanonicalEntity & Dictionary<any>> {
    return entity
  }

  async getQuery(subject:UUID, access:AccessType): Promise<SearchQuery> {
    return {
      created_by:subject
    }
  }
}
