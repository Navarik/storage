import { State, CanonicalEntity, SearchIndex, UUID } from "../types";
interface LocalStateConfig<B extends object, M extends object> {
    size: number;
    searchIndex: SearchIndex<B, M>;
}
export declare class LocalState<B extends object, M extends object> implements State<B, M> {
    private maxSize;
    private cache;
    private searchIndex;
    constructor({ size, searchIndex }: LocalStateConfig<B, M>);
    put(document: CanonicalEntity<B, M>): Promise<void>;
    get(id: UUID): Promise<CanonicalEntity<B, M>>;
    delete(id: UUID): Promise<void>;
    up(): Promise<void>;
    down(): Promise<void>;
    isHealthy(): Promise<boolean>;
    stats(): Promise<{
        cacheSize: number;
        cacheUsed: number;
    }>;
}
export {};
