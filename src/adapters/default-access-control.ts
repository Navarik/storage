import { AccessControlAdapter, CanonicalEntity, AccessControlDecision, UUID, AccessType, SearchQuery } from '../types'

export class DefaultAccessControl<M extends object> implements AccessControlAdapter<M> {
  async check<B extends object>(subject: UUID, action: AccessType, object: CanonicalEntity<B, M>): Promise<AccessControlDecision> {
    return {
      granted: true,
      explanation: `[DefaultAccessControl]: Granted - ${subject} => ${action} => ${object && object.id}`
    }
  }

  async getQuery(subject: UUID, access: AccessType): Promise<SearchQuery|undefined> {
    return undefined
  }
}
