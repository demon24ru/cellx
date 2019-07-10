import { Cell, ICellOptions, TCellPull } from './Cell';
import { IEvent, TListener } from './EventEmitter';
export { IEvent, TListener, IRegisteredEvent, EventEmitter } from './EventEmitter';
export { TObservableMapEntries, ObservableMap } from './collections/ObservableMap';
export { TObservableListItemComparator, TObservableListItems, IObservableListOptions, ObservableList } from './collections/ObservableList';
export { TCellPull, ICellOptions, ICellChangeEvent, ICellErrorEvent, TCellEvent, Cell } from './Cell';
export { WaitError } from './WaitError';
export { configure } from './config';
export interface ICellx<T = any, M = any> {
    (value?: T): T;
    cell: Cell<T, M>;
    on(type: 'change' | 'error', listener: TListener, context?: any): Cell<T, M>;
    on(listeners: Record<'change' | 'error', TListener>, context?: any): Cell<T, M>;
    off(type: 'change' | 'error', listener: TListener, context?: any): Cell<T, M>;
    off(listeners?: Record<'change' | 'error', TListener>, context?: any): Cell<T, M>;
    addChangeListener(listener: TListener, context?: any): Cell<T, M>;
    removeChangeListener(listener: TListener, context?: any): Cell<T, M>;
    addErrorListener(listener: TListener, context?: any): Cell<T, M>;
    removeErrorListener(listener: TListener, context?: any): Cell<T, M>;
    subscribe(listener: (err: Error | null, evt: IEvent) => any, context?: any): Cell<T, M>;
    unsubscribe(listener: (err: Error | null, evt: IEvent) => any, context?: any): Cell<T, M>;
    value: T;
    reap(): Cell<T, M>;
    dispose(): Cell<T, M>;
}
export declare function cellx<T = any, M = any>(value: T | TCellPull<T>, options?: ICellOptions<T, M>): ICellx<T>;
export declare function defineObservableProperty<T extends object = object>(obj: T, name: string, value: any): T;
export declare function defineObservableProperties<T extends object = object>(obj: T, props: Record<string, any>): T;
export declare function define<T extends object = object>(obj: T, name: string, value: any): T;
export declare function define<T extends object = object>(obj: T, props: Record<string, any>): T;
