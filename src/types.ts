import type { Request, Response } from "express";
import { InlineConfig, ResolvedConfig as ViteResolveConfig } from "vite";
export interface HttpContext {
  request: Request;
  response: Response;
}

export type AssetsVersion = string | number | undefined;

export type Data = string | number | object | boolean;
export type MaybePromise<T> = T | Promise<T>;
export type SharedDatumFactory = (
  req: Request,
  res: Response
) => MaybePromise<Data>;
export type SharedData = Record<string, Data | SharedDatumFactory>;
export interface BaseConfig {
  rootElementId?: string;
  encryptHistory?: boolean;
  clientStaticBuildDir?: string;
  indexEntrypoint?: string;
  indexBuildEntrypoint?: string;
  vite?: InlineConfig | ViteResolveConfig;
}

interface ConfigWithoutSSR extends BaseConfig {
  ssrEnabled: false;
  ssrEntrypoint?: never;
  ssrBuildEntrypoint?: never;
}

interface ConfigWithSSR extends BaseConfig {
  ssrEnabled: true;
  ssrEntrypoint: string;
  ssrBuildEntrypoint: string;
}

export type ResolvedConfig = ConfigWithoutSSR | ConfigWithSSR;

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

export interface ViteOptions {
  buildDirectory: string;
  manifestFile: string;
  assetsUrl?: string;
  styleAttributes?: SetAttributes;
  scriptAttributes?: SetAttributes;
}
