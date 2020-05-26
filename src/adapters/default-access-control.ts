import { AccessControlAdapter, CanonicalEntity, AccessControlDecision, UUID, AccessType, SearchQuery } from '../types'

export class DefaultAccessControl<B, M> implements AccessControlAdapter<B, M> {
  async check(subject: UUID, action: AccessType, object: CanonicalEntity<B, M>): Promise<AccessControlDecision> {
    return {
      granted: true,
      explanation: `[DefaultAccessControl]: Granted - "${subject}" => "${action}" => "${object && object.id}"`
    }
  }

  async attachTerms(entity: CanonicalEntity<B, M>): Promise<CanonicalEntity<B, M>> {
    return entity
  }

  async getQuery(subject: UUID, access: AccessType): Promise<SearchQuery> {
    return {}
  }
}
