import { AccessControlAdapter, CanonicalEntity, AccessControlDecision, UUID, AccessType, AccessControlList, AccessControlQueryTerms } from '../types'

export class DefaultAccessControl implements AccessControlAdapter<CanonicalEntity> {
  check(subject:UUID, action:AccessType, object:CanonicalEntity): AccessControlDecision {
    return {
      granted: true,
      explain: () => `[DefaultAccessControl]: All access requests granted. "${subject}" granted "${action}" on "${object.id}"`
    }
  }

  async createAcl(entity:CanonicalEntity): Promise<AccessControlList> {
    return {
      container: 'deadbeef-dead-dead-dead-deaddeadbeef',
      dac: [{subject: entity.created_by, access: 'read'}, {subject: entity.created_by, access: 'write'}],
      mac: ['dogedoge-orca-orca-doge-dogeorcadoge'],
    }
  }

  async getQueryTerms(subject:UUID, access:AccessType): Promise<AccessControlQueryTerms> {
    const result = {
      dac: [{subject, access}, {subject, access: 'whale'}],
      mac: ['dogedoge-orca-orca-doge-dogeorcadoge']
    }

    return <any>result
  }
}
