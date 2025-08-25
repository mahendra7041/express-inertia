var _a, _b;
export const ignoreFirstLoadSymbol = Symbol("ignoreFirstLoad");
export class MergeableProp {
    constructor() {
        this.shouldMerge = false;
    }
    merge() {
        this.shouldMerge = true;
        return this;
    }
}
export class OptionalProp {
    constructor(callback) {
        this.callback = callback;
        this[_a] = true;
    }
}
_a = ignoreFirstLoadSymbol;
export class DeferProp extends MergeableProp {
    constructor(callback, group) {
        super();
        this.callback = callback;
        this.group = group;
        this[_b] = true;
    }
    getGroup() {
        return this.group;
    }
}
_b = ignoreFirstLoadSymbol;
export class MergeProp extends MergeableProp {
    constructor(callback) {
        super();
        this.callback = callback;
        this.shouldMerge = true;
    }
}
export class AlwaysProp extends MergeableProp {
    constructor(callback) {
        super();
        this.callback = callback;
    }
}
