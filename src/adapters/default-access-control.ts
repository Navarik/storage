import { AccessControlAdapter, CanonicalEntity, AccessControlDecision, UUID } from '../types'

export class DefaultAccessControl implements AccessControlAdapter<CanonicalEntity> {
  access(subject:UUID, action:string, object:CanonicalEntity): AccessControlDecision {
    return {
      granted: true,
      explain: () => `[DefaultAccessControl]: All access requests granted. "${subject}" granted "${action}" on "${object.id}"`
    }
  }
}
