import { Dictionary } from '@navarik/types'
import { AccessControlAdapter, CanonicalEntity, AccessControlDecision, UUID, AccessType } from '../types'

export class DefaultAccessControl<M extends object> implements AccessControlAdapter<M> {
  async check<B extends object>(subject: UUID, action: AccessType, object: CanonicalEntity<B, M>): Promise<AccessControlDecision> {
    return {
      granted: true,
      explanation: `[DefaultAccessControl]: Granted - "${subject}" => "${action}" => "${object && object.id}"`
    }
  }

  async attachTerms<B extends object>(entity: CanonicalEntity<B, M>): Promise<CanonicalEntity<B, M>> {
    return entity
  }

  async getQuery(subject: UUID, access: AccessType): Promise<Dictionary<any>> {
    return {}
  }
}
