import { Cell, ICellOptions, TCellEvent, TCellPull } from './Cell';
import { IObservableListOptions, ObservableList, TObservableListItems } from './collections/ObservableList';
import { ObservableMap, TObservableMapEntries } from './collections/ObservableMap';
import { TListener } from './EventEmitter';
export { IEvent, TListener, IRegisteredEvent, EventEmitter } from './EventEmitter';
export { TObservableMapEntries, ObservableMap } from './collections/ObservableMap';
export { TObservableListItemComparator, TObservableListItems, IObservableListOptions, ObservableList } from './collections/ObservableList';
export { TCellPull, ICellOptions, ICellChangeEvent, ICellErrorEvent, TCellEvent, Cell } from './Cell';
export { WaitError } from './WaitError';
export declare function map<K = any, V = any>(entries?: TObservableMapEntries<K, V> | null): ObservableMap<K, V>;
export declare function list<T = any>(items?: TObservableListItems<T> | null, options?: IObservableListOptions<T>): ObservableList<T>;
export interface ICellx<T> {
    (value?: T): T;
    (method: 'cell', _: any): Cell<T>;
    (method: 'bind', _: any): ICellx<T>;
    (method: 'addChangeListener' | 'removeChangeListener' | 'addErrorListener' | 'removeErrorListener', listener: TListener, context?: any): Cell<T>;
    (method: 'subscribe' | 'unsubscribe', listener: (err: Error | null, evt: TCellEvent) => any, context?: any): Cell<T>;
    (method: 'pull', _: any): boolean;
    (method: 'getError', _: any): Error | null;
    (method: 'isPending', _: any): boolean;
    (method: 'push', value: any): Cell<T>;
    (method: 'fail', err: any): Cell<T>;
    <U = any>(method: 'then', onFulfilled: ((value: T) => U) | null, onRejected?: (err: Error) => U): Promise<U>;
    <U = any>(method: 'catch', onRejected: (err: Error) => U): Promise<U>;
    (method: 'reap' | 'dispose', _: any): Cell<T>;
}
export declare const KEY_CELL_MAP: symbol;
export declare function cellx<T = any, M = any>(value: T | TCellPull<T>, options?: ICellOptions<T, M>): ICellx<T>;
export declare function defineObservableProperty<T extends object = object>(obj: T, name: string, value: any): T;
export declare function defineObservableProperties<T extends object = object>(obj: T, props: {
    [name: string]: string;
}): T;
export declare function define<T extends object = object>(obj: T, name: string, value: any): T;
export declare function define<T extends object = object>(obj: T, props: {
    [name: string]: any;
}): T;
