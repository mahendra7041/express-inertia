import { ServerRenderer } from "./server_renderer.js";
import type {
  BaseConfig,
  Data,
  MaybePromise,
  PageObject,
  PageProps,
  ResolvedConfig,
  SharedData,
} from "./types.js";
import {
  AlwaysProp,
  DeferProp,
  ignoreFirstLoadSymbol,
  MergeableProp,
  MergeProp,
  OptionalProp,
} from "./props.js";
import { InertiaHeaders } from "./headers.js";
import path from "path";
import { readFile } from "fs/promises";
import type { Request, Response } from "express";
import type { ViteDevServer } from "vite";

export class Inertia {
  private sharedData: SharedData = {};
  private serverRenderer: ServerRenderer;
  private shouldClearHistory: boolean;
  private shouldEncryptHistory: boolean;
  private rootElementId: string;

  constructor(
    protected req: Request,
    protected res: Response,
    protected config: ResolvedConfig & Required<BaseConfig>,
    protected vite?: ViteDevServer
  ) {
    this.rootElementId = config.rootElementId || "app";
    this.serverRenderer = new ServerRenderer(config, this.vite);
    this.shouldClearHistory = false;
    this.shouldEncryptHistory = config.encryptHistory || true;
    this.sharedData = {
      errors: (req: Request) => req.flash.get("errors") || {},
      flash: (req: Request) => {
        return {
          error: req.flash.get("error") || null,
          success: req.flash.get("success") || null,
        };
      },
    };
  }

  private isPartial(component: string) {
    return this.req.get(InertiaHeaders.PartialComponent) === component;
  }

  private resolveOnly(props: PageProps) {
    const partialOnlyHeader = this.req.get(InertiaHeaders.PartialOnly);
    const only = partialOnlyHeader!.split(",").filter(Boolean);
    let newProps: PageProps = {};

    for (const key of only) newProps[key] = props[key];

    return newProps;
  }

  private resolveExcept(props: PageProps) {
    const partialExceptHeader = this.req.get(InertiaHeaders.PartialExcept);
    const except = partialExceptHeader!.split(",").filter(Boolean);

    for (const key of except) delete props[key];

    return props;
  }

  private pickPropsToResolve(component: string, props: PageProps = {}) {
    const isPartial = this.isPartial(component);
    let newProps = props;

    if (!isPartial) {
      newProps = Object.fromEntries(
        Object.entries(props).filter(([_, value]) => {
          if (value && (value as any)[ignoreFirstLoadSymbol]) return false;

          return true;
        })
      );
    }

    const partialOnlyHeader = this.req.get(InertiaHeaders.PartialOnly);
    if (isPartial && partialOnlyHeader) newProps = this.resolveOnly(props);

    const partialExceptHeader = this.req.get(InertiaHeaders.PartialExcept);
    if (isPartial && partialExceptHeader)
      newProps = this.resolveExcept(newProps);

    for (const [key, value] of Object.entries(props)) {
      if (value instanceof AlwaysProp) newProps[key] = props[key];
    }

    return newProps;
  }

  private async resolveProp(key: string, value: any) {
    if (
      value instanceof OptionalProp ||
      value instanceof MergeProp ||
      value instanceof DeferProp ||
      value instanceof AlwaysProp
    ) {
      return [key, await value.callback()];
    }

    return [key, value];
  }

  async resolvePageProps(props: PageProps = {}) {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(props).map(async ([key, value]) => {
          if (typeof value === "function") {
            const result = await value(this.req, this.res);
            return this.resolveProp(key, result);
          }

          return this.resolveProp(key, value);
        })
      )
    );
  }

  private resolveDeferredProps(component: string, pageProps?: PageProps) {
    if (this.isPartial(component)) return {};

    const deferredProps = Object.entries(pageProps || {})
      .filter(([_, value]) => value instanceof DeferProp)
      .map(([key, value]) => ({
        key,
        group: (value as DeferProp<any>).getGroup(),
      }))
      .reduce((groups, { key, group }) => {
        if (!groups[group]) groups[group] = [];

        groups[group].push(key);
        return groups;
      }, {} as Record<string, string[]>);

    return Object.keys(deferredProps).length ? { deferredProps } : {};
  }

  private resolveMergeProps(pageProps?: PageProps) {
    const inertiaResetHeader = this.req.get(InertiaHeaders.Reset) || "";
    const resetProps = new Set(inertiaResetHeader.split(",").filter(Boolean));

    const mergeProps = Object.entries(pageProps || {})
      .filter(
        ([_, value]) => value instanceof MergeableProp && value.shouldMerge
      )
      .map(([key]) => key)
      .filter((key) => !resetProps.has(key));

    return mergeProps.length ? { mergeProps } : {};
  }

  private async buildPageObject<TPageProps extends PageProps>(
    component: string,
    pageProps?: TPageProps
  ): Promise<PageObject<TPageProps>> {
    const propsToResolve = this.pickPropsToResolve(component, {
      ...this.sharedData,
      ...pageProps,
    });

    return {
      component,
      url: this.req.url,
      version: 1,
      props: await this.resolvePageProps(propsToResolve),
      clearHistory: this.shouldClearHistory,
      encryptHistory: this.shouldEncryptHistory,
      ...this.resolveMergeProps(pageProps),
      ...this.resolveDeferredProps(component, pageProps),
    };
  }

  private resolveRootView() {
    const index =
      process.env.NODE_ENV !== "production"
        ? this.config.indexEntrypoint
        : this.config.indexBuildEntrypoint;
    return path.resolve(index);
  }

  private async getTemplate(): Promise<string> {
    let template = await readFile(this.resolveRootView(), "utf8");
    if (this.vite) {
      template = await this.vite.transformIndexHtml(this.req.url, template);
    }
    return template;
  }

  private async renderOnServer(pageObject: PageObject) {
    const { head, body } = await this.serverRenderer.render(pageObject);

    const template = await this.getTemplate();

    const html = template
      .replace("<!-- @inertiaHead -->", () => head || "")
      .replace("<!-- @inertia -->", () => body || "");

    return this.res.send(html);
  }

  private async renderOnClient(pageObject: PageObject) {
    const template = await this.getTemplate();

    const html = template
      .replace("<!-- @inertiaHead -->", () => "")
      .replace(
        "<!-- @inertia -->",
        () =>
          `<div id="${this.rootElementId}" data-page="${this.encodePageProps(
            pageObject
          )}"></div>`
      );
    return this.res.send(html);
  }

  private encodePageProps(data: Record<any, any>) {
    return JSON.stringify(data).replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  share(data: Record<string, Data>) {
    this.sharedData = { ...this.sharedData, ...data };
  }

  private isValidVersion() {
    const version = "1";
    if (
      this.req.method === "GET" &&
      this.req.get(InertiaHeaders.Version) !== version
    ) {
      return false;
    }
    return true;
  }

  async render<TPageProps extends Record<string, any> = {}>(
    component: string,
    pageProps?: TPageProps
  ): Promise<any> {
    const pageObject = await this.buildPageObject(component, pageProps);
    const isInertiaRequest = !!this.req.get(InertiaHeaders.Inertia);

    if (!isInertiaRequest) {
      if (this.config.ssrEnabled) return this.renderOnServer(pageObject);

      return this.renderOnClient(pageObject);
    }

    this.res.setHeader("Vary", InertiaHeaders.Inertia);

    if (!this.isValidVersion()) {
      return this.location(this.req.url);
    }

    this.res.setHeader(InertiaHeaders.Inertia, "true");
    this.res.json(pageObject);
  }

  clearHistory() {
    this.shouldClearHistory = true;
  }

  encryptHistory(encrypt = true) {
    this.shouldEncryptHistory = encrypt;
  }

  lazy<T>(callback: () => MaybePromise<T>) {
    return new OptionalProp(callback);
  }

  optional<T>(callback: () => MaybePromise<T>) {
    return new OptionalProp(callback);
  }

  merge<T>(callback: () => MaybePromise<T>) {
    return new MergeProp(callback);
  }

  always<T>(callback: () => MaybePromise<T>) {
    return new AlwaysProp(callback);
  }

  defer<T>(callback: () => MaybePromise<T>, group = "default") {
    return new DeferProp(callback, group);
  }

  async location(url: string) {
    this.res.setHeader(InertiaHeaders.Location, url);
    this.res.status(409);
    this.res.end();
  }

  async redirect(url: string) {
    const method = this.req.method;
    if (
      this.res.statusCode === 302 &&
      ["PUT", "PATCH", "DELETE"].includes(method)
    ) {
      return this.res.redirect(303, url);
    }
    this.res.setHeader("Vary", InertiaHeaders.Inertia);
    this.res.redirect(url);
  }
}
