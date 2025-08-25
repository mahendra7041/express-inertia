import type { MaybePromise } from "./types.js";
export declare const ignoreFirstLoadSymbol: unique symbol;
export declare abstract class MergeableProp {
    shouldMerge: boolean;
    merge(): this;
}
export declare class OptionalProp<T extends MaybePromise<any>> {
    callback: T;
    [ignoreFirstLoadSymbol]: boolean;
    constructor(callback: T);
}
export declare class DeferProp<T extends MaybePromise<any>> extends MergeableProp {
    callback: T;
    private group;
    [ignoreFirstLoadSymbol]: true;
    constructor(callback: T, group: string);
    getGroup(): string;
}
export declare class MergeProp<T extends MaybePromise<any>> extends MergeableProp {
    callback: T;
    constructor(callback: T);
}
export declare class AlwaysProp<T extends MaybePromise<any>> extends MergeableProp {
    callback: T;
    constructor(callback: T);
}
