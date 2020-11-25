import { CanonicalEntity, ChangeEvent, ActionType, SchemaRegistry } from './types';
declare type FactoryConfig = {
    ddl: SchemaRegistry;
};
export declare class ChangeEventFactory<B extends object, M extends object> {
    private ddl;
    constructor({ ddl }: FactoryConfig);
    create(action: ActionType, entity: CanonicalEntity<B, M>, commitMessage: string): ChangeEvent<B, M>;
}
export {};
