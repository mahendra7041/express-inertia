import type { Request, Response } from "express";
import type { VersionCache } from "./version_cache.js";

export interface HttpContext {
  request: Request;
  response: Response;
}

export type AssetsVersion = string | number | undefined;

export type Data = string | number | object | boolean;
export type MaybePromise<T> = T | Promise<T>;
export type SharedDatumFactory = (ctx: HttpContext) => MaybePromise<Data>;
export type SharedData = Record<string, Data | SharedDatumFactory>;
export interface ResolvedConfig<T extends SharedData = SharedData> {
  sharedData: T;
  history: { encrypt: boolean };
  ssr: {
    enabled: boolean;
    entrypoint: string;
    pages?:
      | string[]
      | ((req: Request, res: Response, page: string) => MaybePromise<boolean>);
    bundle: string;
  };
}

export type PageProps = Record<string, unknown>;

export interface PageObject<TPageProps extends PageProps = PageProps> {
  ssrHead?: string;
  ssrBody?: string;
  component: string;
  version: string | number;
  props: TPageProps;
  url: string;
  deferredProps?: Record<string, string[]>;
  mergeProps?: string[];
  encryptHistory?: boolean;
  clearHistory?: boolean;
}

export type RenderInertiaSsrApp = (
  page: PageObject
) => Promise<{ head: string[]; body: string }>;

export type SetAttributesCallbackParams = {
  src: string;
  url: string;
};

export type SetAttributes =
  | Record<string, string | boolean>
  | ((params: SetAttributesCallbackParams) => Record<string, string | boolean>);

export type AdonisViteElement =
  | {
      tag: "link";
      attributes: Record<string, any>;
    }
  | {
      tag: "script";
      attributes: Record<string, any>;
      children: string[];
    };

export interface ViteOptions {
  buildDirectory: string;
  manifestFile: string;
  assetsUrl?: string;
  styleAttributes?: SetAttributes;
  scriptAttributes?: SetAttributes;
}
