import type { MaybePromise } from "./types.js";

export const ignoreFirstLoadSymbol = Symbol("ignoreFirstLoad");

export abstract class MergeableProp {
  public shouldMerge = false;

  public merge() {
    this.shouldMerge = true;
    return this;
  }
}

export class OptionalProp<T extends MaybePromise<any>> {
  [ignoreFirstLoadSymbol] = true;

  constructor(public callback: T) {}
}

export class DeferProp<T extends MaybePromise<any>> extends MergeableProp {
  [ignoreFirstLoadSymbol] = true as const;

  constructor(public callback: T, private group: string) {
    super();
  }

  public getGroup() {
    return this.group;
  }
}

export class MergeProp<T extends MaybePromise<any>> extends MergeableProp {
  constructor(public callback: T) {
    super();
    this.shouldMerge = true;
  }
}

export class AlwaysProp<T extends MaybePromise<any>> extends MergeableProp {
  constructor(public callback: T) {
    super();
  }
}
