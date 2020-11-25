import { Dictionary, Service, EventLog } from '@navarik/types';
import { CanonicalSchema, ValidationResponse, FormattedEntity } from '@navarik/core-ddl';
export declare type Timestamp = string;
export declare type UUID = string;
export interface CanonicalEntity<B extends object, M extends object> {
    id: UUID;
    version_id: UUID;
    previous_version_id: UUID | null;
    created_by: UUID;
    created_at: Timestamp;
    modified_by: UUID;
    modified_at: Timestamp;
    type: string;
    body: B;
    meta: M;
    schema: UUID;
}
export declare type EntityData<B extends object, M extends object> = Partial<CanonicalEntity<B, M>> & {
    type: string;
    body: B;
};
export declare type EntityPatch<B extends object, M extends object> = Partial<CanonicalEntity<B, M>> & {
    id: UUID;
    body: B;
    version_id: UUID;
};
export declare type ActionType = 'create' | 'update' | 'delete';
export interface ChangeEvent<B extends object, M extends object> {
    action: ActionType;
    user: UUID;
    timestamp: Timestamp;
    message: string;
    entity: CanonicalEntity<B, M>;
    schema: CanonicalSchema | undefined;
    parent: CanonicalEntity<B, M> | undefined;
}
export declare type AccessType = 'read' | 'write';
export declare type AccessGrant = {
    subject: UUID;
    access: AccessType;
};
export declare type AccessControlQueryTerms = {
    dac: Array<AccessGrant>;
    mac: Array<UUID>;
};
export declare type AccessControlDecision = {
    granted: boolean;
    explanation: string;
};
export interface AccessControlAdapter<B extends object, M extends object> {
    check(subject: UUID, action: AccessType, object: CanonicalEntity<B, M>): Promise<AccessControlDecision>;
    attachTerms(entity: CanonicalEntity<B, M>): Promise<CanonicalEntity<B, M>>;
    getQuery(subject: UUID, access: AccessType): Promise<SearchQuery>;
}
export declare type Observer<B extends object, M extends object> = (event: ChangeEvent<B, M>) => void | Promise<void>;
export interface Changelog<B extends object, M extends object> extends EventLog<ChangeEvent<B, M>> {
}
export interface State<B extends object, M extends object> extends Service {
    put(document: CanonicalEntity<B, M>): Promise<void>;
    get(id: string): Promise<CanonicalEntity<B, M>>;
    delete(id: string): Promise<void>;
    stats(): Promise<object>;
}
export declare type SearchQuery = Dictionary<string | object | number | boolean>;
export declare type SearchOptions = {
    limit?: number;
    offset?: number;
    sort?: string | Array<string>;
};
export interface SearchIndex<B extends object, M extends object> extends Service {
    update(action: ActionType, document: CanonicalEntity<B, M>, schema?: CanonicalSchema, metaSchema?: CanonicalSchema): Promise<void>;
    find(query: SearchQuery, options: SearchOptions): Promise<Array<CanonicalEntity<B, M>>>;
    count(query: SearchQuery): Promise<number>;
    isClean(): Promise<boolean>;
}
export declare class SchemaRegistry {
    types(): Array<string>;
    define(schema: CanonicalSchema): void;
    describe(key: string): CanonicalSchema | undefined;
    validate(key: string, body: Partial<Dictionary<any>>): ValidationResponse;
    format(key: string, body: Partial<Dictionary<any>>): FormattedEntity;
}
export { CanonicalSchema, ValidationResponse, FormattedEntity };
