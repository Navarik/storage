import { CanonicalEntity, EntityData, EntityPatch, UUID, SchemaRegistry } from './types';
declare type FactoryConfig = {
    ddl: SchemaRegistry;
    metaDdl: SchemaRegistry;
    metaType: string;
};
export declare class EntityFactory<B extends object, M extends object> {
    private ddl;
    private metaDdl;
    private metaType;
    constructor({ ddl, metaDdl, metaType }: FactoryConfig);
    create({ id, type, body, meta }: EntityData<B, M>, user: UUID): CanonicalEntity<B, M>;
    merge(oldEntity: CanonicalEntity<Partial<B>, Partial<M>>, patch: EntityPatch<B, M>, user: UUID): CanonicalEntity<B, M>;
}
export {};
