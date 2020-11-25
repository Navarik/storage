import { AccessControlAdapter, CanonicalEntity, AccessControlDecision, UUID, AccessType, SearchQuery } from '../types';
export declare class DefaultAccessControl<B extends object, M extends object> implements AccessControlAdapter<B, M> {
    check(subject: UUID, action: AccessType, object: CanonicalEntity<B, M>): Promise<AccessControlDecision>;
    attachTerms(entity: CanonicalEntity<B, M>): Promise<CanonicalEntity<B, M>>;
    getQuery(subject: UUID, access: AccessType): Promise<SearchQuery>;
}
