import { Logger } from '@navarik/types';
import { SearchIndex, SearchQuery, SearchOptions, CanonicalEntity, ActionType } from '../../types';
declare type Config = {
    logger: Logger;
};
export declare class NeDbSearchIndex<B extends object, M extends object> implements SearchIndex<B, M> {
    private logger;
    private client;
    private queryParser;
    constructor({ logger }: Config);
    private convertToSearchable;
    find(searchParams: SearchQuery, options?: SearchOptions): Promise<Array<CanonicalEntity<B, M>>>;
    count(searchParams: SearchQuery): Promise<number>;
    index(document: CanonicalEntity<B, M>): Promise<void>;
    update(action: ActionType, document: CanonicalEntity<B, M>): Promise<void>;
    delete(document: CanonicalEntity<B, M>): Promise<void>;
    up(): Promise<void>;
    down(): Promise<void>;
    isHealthy(): Promise<boolean>;
    isClean(): Promise<boolean>;
}
export {};
