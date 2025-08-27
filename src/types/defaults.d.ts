// defaults.d.ts
declare module "defaults" {
  function defaults<T, U>(options: T, defaultOptions: U): T & U;
  function defaults<T, U, V>(
    options: T,
    defaultOptions: U,
    defaultOptions2: V
  ): T & U & V;
  function defaults<T>(options: T, ...defaults: any[]): T;

  export = defaults;
}
