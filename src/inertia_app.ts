import { ServerRenderer } from "./server_renderer.js";
import type {
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
import fs from "fs/promises";
import type { Request, Response } from "express";
import { ViteDevServer } from "vite";

export class InertiaApp {
  private sharedData: SharedData = {};
  private serverRenderer: ServerRenderer;
  private shouldClearHistory = false;
  private shouldEncryptHistory = false;

  constructor(
    protected req: Request,
    protected res: Response,
    protected config: ResolvedConfig,
    protected vite?: ViteDevServer
  ) {
    this.sharedData = config.sharedData;
    this.serverRenderer = new ServerRenderer(config, this.vite);
    this.shouldClearHistory = false;
    this.shouldEncryptHistory = config.history.encrypt;
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

    const partialOnlyHeader = this.req.header(InertiaHeaders.PartialOnly);
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

  private async resolvePageProps(props: PageProps = {}) {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(props).map(async ([key, value]) => {
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

  private async shouldRenderOnServer(component: string) {
    const isSsrEnabled = this.config.ssr.enabled;
    if (!isSsrEnabled) return false;

    let isSsrEnabledForPage = false;
    if (typeof this.config.ssr.pages === "function") {
      isSsrEnabledForPage = await this.config.ssr.pages(
        this.req,
        this.res,
        component
      );
    } else if (this.config.ssr.pages) {
      isSsrEnabledForPage = this.config.ssr.pages?.includes(component);
    } else {
      isSsrEnabledForPage = true;
    }

    return isSsrEnabledForPage;
  }

  private resolveRootView() {
    return path.resolve("index.html");
  }

  private async renderOnServer(pageObject: PageObject) {
    const { head, body } = await this.serverRenderer.render(pageObject);

    const html = await this.generateHtml(this.resolveRootView(), {
      ssrHead: head,
      ssrBody: body,
      ...pageObject,
    });

    return this.res.send(html);
  }

  share(data: Record<string, Data>) {
    this.sharedData = { ...this.sharedData, ...data };
  }

  private async generateHtml(indexFile: string, pageObject: PageObject) {
    let template = await fs.readFile(indexFile, "utf-8");

    if (this.vite) {
      template = await this.vite.transformIndexHtml(this.req.url, template);
    }

    const html = template
      .replace("<!--ssr-head-->", () => pageObject.ssrHead || "")
      .replace("<!--ssr-outlet-->", () => pageObject.ssrBody || "");

    return html;
  }

  async render<TPageProps extends Record<string, any> = {}>(
    component: string,
    pageProps?: TPageProps
  ): Promise<any> {
    const pageObject = await this.buildPageObject(component, pageProps);
    const isInertiaRequest = !!this.req.get(InertiaHeaders.Inertia);

    if (!isInertiaRequest) {
      const shouldRenderOnServer = await this.shouldRenderOnServer(component);
      if (shouldRenderOnServer) return this.renderOnServer(pageObject);

      const html = this.generateHtml(this.resolveRootView(), pageObject);

      return this.res.send(html);
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
  }
}
