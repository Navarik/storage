import { Changelog, Observer, ChangeEvent } from '../types';
export declare class DefaultChangelog<B extends object, M extends object> implements Changelog<B, M> {
    private observer?;
    private log;
    constructor(staticLog?: Array<ChangeEvent<B, M>>);
    observe(handler: Observer<B, M>): void;
    write(message: ChangeEvent<B, M>): Promise<void>;
    readAll(): Promise<void>;
    up(): Promise<void>;
    down(): Promise<void>;
    isHealthy(): Promise<boolean>;
}
