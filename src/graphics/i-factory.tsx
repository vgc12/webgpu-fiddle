// Generic factory interface for creating objects synchronously or asynchronously.
// Used where construction may require async GPU initialization.
export interface IFactory<T> {
    create(): T;

    createAsync(): Promise<T>;
}