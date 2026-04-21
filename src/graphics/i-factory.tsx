export interface IFactory<T> {
    create(): T;

    createAsync(): Promise<T>;
}