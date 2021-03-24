import { AccessControlAdapter, CanonicalEntity, AccessControlDecision, UUID, AccessType, SearchQuery } from '../types'

export class DefaultAccessControl implements AccessControlAdapter {
  async check<B extends object, M extends object>(subject: UUID, action: AccessType, object: CanonicalEntity<B, M>): Promise<AccessControlDecision> {
    return {
      granted: true,
      explanation: `[DefaultAccessControl]: Granted - "${subject}" => "${action}" => "${object && object.id}"`
    }
  }

  async attachTerms<B extends object, M extends object>(entity: CanonicalEntity<B, M>): Promise<CanonicalEntity<B, M>> {
    return entity
  }

  async getQuery(subject: UUID, access: AccessType): Promise<SearchQuery> {
    return {}
  }
}
