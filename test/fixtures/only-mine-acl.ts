import { Dictionary } from '@navarik/types'
import { AccessControlAdapter, CanonicalEntity, AccessControlDecision, UUID, AccessType } from '../../src/types'

export class OnlyMineAccessControl implements AccessControlAdapter<any> {
  async check(subject: UUID, action: AccessType, object: CanonicalEntity<any, any>): Promise<AccessControlDecision> {
    if (object && (object.modified_by === subject)) {
      return {
        granted: true,
        explanation: `[OnlyMineAccessControl]: Granted - "${subject}" => "${action}" => "${object && object.id}"`
      }
    } else {
      return {
        granted: true,
        explanation: `[OnlyMineAccessControl]: Denied - "${subject}" => "${action}" => "${object && object.id}"`
      }
    }
  }

  async attachTerms(entity: CanonicalEntity<any, any>): Promise<CanonicalEntity<any, any>> {
    return entity
  }

  async getQuery(subject: UUID, access: AccessType): Promise<Dictionary<any>> {
    return {
      modified_by: subject
    }
  }
}
