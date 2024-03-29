import { AccessControlAdapter, CanonicalEntity, AccessControlDecision, UUID, AccessType, SearchQuery } from '../../src/types'

export class OnlyMineAccessControl implements AccessControlAdapter<any> {
  async check(subject: UUID, action: AccessType, object: CanonicalEntity<any, any>): Promise<AccessControlDecision> {
    if (object && (object.modified_by === subject)) {
      return {
        granted: true,
        explanation: `[OnlyMineAccessControl]: Granted - "${subject}" => "${action}" => "${object && object.id}"`
      }
    } else {
      return {
        granted: false,
        explanation: `[OnlyMineAccessControl]: Denied - "${subject}" => "${action}" => "${object && object.id}"`
      }
    }
  }

  async getQuery(subject: UUID, access: AccessType): Promise<SearchQuery> {
    return {
      operator: "eq",
      args: ["modified_by", subject]
    }
  }
}
