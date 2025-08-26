import { ServerRenderer } from "./server_renderer.js";
import { AlwaysProp, DeferProp, ignoreFirstLoadSymbol, MergeableProp, MergeProp, OptionalProp, } from "./props.js";
import { InertiaHeaders } from "./headers.js";
import path from "path";
import { readFile } from "fs/promises";
export class Inertia {
    constructor(req, res, config, vite) {
        this.req = req;
        this.res = res;
        this.config = config;
        this.vite = vite;
        this.sharedData = {};
        this.shouldClearHistory = false;
        this.shouldEncryptHistory = false;
        this.sharedData = config.sharedData;
        this.serverRenderer = new ServerRenderer(config, this.vite);
        this.shouldClearHistory = false;
        this.shouldEncryptHistory = config.encryptHistory;
    }
    isPartial(component) {
        return this.req.get(InertiaHeaders.PartialComponent) === component;
    }
    resolveOnly(props) {
        const partialOnlyHeader = this.req.get(InertiaHeaders.PartialOnly);
        const only = partialOnlyHeader.split(",").filter(Boolean);
        let newProps = {};
        for (const key of only)
            newProps[key] = props[key];
        return newProps;
    }
    resolveExcept(props) {
        const partialExceptHeader = this.req.get(InertiaHeaders.PartialExcept);
        const except = partialExceptHeader.split(",").filter(Boolean);
        for (const key of except)
            delete props[key];
        return props;
    }
    pickPropsToResolve(component, props = {}) {
        const isPartial = this.isPartial(component);
        let newProps = props;
        if (!isPartial) {
            newProps = Object.fromEntries(Object.entries(props).filter(([_, value]) => {
                if (value && value[ignoreFirstLoadSymbol])
                    return false;
                return true;
            }));
        }
        const partialOnlyHeader = this.req.get(InertiaHeaders.PartialOnly);
        if (isPartial && partialOnlyHeader)
            newProps = this.resolveOnly(props);
        const partialExceptHeader = this.req.get(InertiaHeaders.PartialExcept);
        if (isPartial && partialExceptHeader)
            newProps = this.resolveExcept(newProps);
        for (const [key, value] of Object.entries(props)) {
            if (value instanceof AlwaysProp)
                newProps[key] = props[key];
        }
        return newProps;
    }
    async resolveProp(key, value) {
        if (value instanceof OptionalProp ||
            value instanceof MergeProp ||
            value instanceof DeferProp ||
            value instanceof AlwaysProp) {
            return [key, await value.callback()];
        }
        return [key, value];
    }
    async resolvePageProps(props = {}) {
        return Object.fromEntries(await Promise.all(Object.entries(props).map(async ([key, value]) => {
            if (typeof value === "function") {
                const result = await value(this.req, this.res);
                return this.resolveProp(key, result);
            }
            return this.resolveProp(key, value);
        })));
    }
    resolveDeferredProps(component, pageProps) {
        if (this.isPartial(component))
            return {};
        const deferredProps = Object.entries(pageProps || {})
            .filter(([_, value]) => value instanceof DeferProp)
            .map(([key, value]) => ({
            key,
            group: value.getGroup(),
        }))
            .reduce((groups, { key, group }) => {
            if (!groups[group])
                groups[group] = [];
            groups[group].push(key);
            return groups;
        }, {});
        return Object.keys(deferredProps).length ? { deferredProps } : {};
    }
    resolveMergeProps(pageProps) {
        const inertiaResetHeader = this.req.get(InertiaHeaders.Reset) || "";
        const resetProps = new Set(inertiaResetHeader.split(",").filter(Boolean));
        const mergeProps = Object.entries(pageProps || {})
            .filter(([_, value]) => value instanceof MergeableProp && value.shouldMerge)
            .map(([key]) => key)
            .filter((key) => !resetProps.has(key));
        return mergeProps.length ? { mergeProps } : {};
    }
    async buildPageObject(component, pageProps) {
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
    resolveRootView() {
        const index = process.env.NODE_ENV !== "production"
            ? this.config.client.entrypoint
            : this.config.client.bundle;
        return path.resolve(index);
    }
    async getTemplate() {
        let template = await readFile(path.resolve("index.html"), "utf8");
        if (this.vite) {
            template = await this.vite.transformIndexHtml(this.req.url, template);
        }
        return template;
    }
    async renderOnServer(pageObject) {
        const { head, body } = await this.serverRenderer.render(pageObject);
        const template = await this.getTemplate();
        const html = template
            .replace("<!-- @inertiaHead -->", () => head || "")
            .replace("<!-- @inertia -->", () => body || "");
        return this.res.send(html);
    }
    async renderOnClient(pageObject) {
        const template = await this.getTemplate();
        const html = template
            .replace("<!-- @inertiaHead -->", () => "")
            .replace("<!-- @inertia -->", () => `<div id="app" data-page="${this.encodePageProps(pageObject)}"></div>`);
        return this.res.send(html);
    }
    encodePageProps(data) {
        return JSON.stringify(data).replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
    share(data) {
        this.sharedData = { ...this.sharedData, ...data };
    }
    async render(component, pageProps) {
        const pageObject = await this.buildPageObject(component, pageProps);
        const isInertiaRequest = !!this.req.get(InertiaHeaders.Inertia);
        if (!isInertiaRequest) {
            if (this.config.ssr)
                return this.renderOnServer(pageObject);
            return this.renderOnClient(pageObject);
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
    lazy(callback) {
        return new OptionalProp(callback);
    }
    optional(callback) {
        return new OptionalProp(callback);
    }
    merge(callback) {
        return new MergeProp(callback);
    }
    always(callback) {
        return new AlwaysProp(callback);
    }
    defer(callback, group = "default") {
        return new DeferProp(callback, group);
    }
    async location(url) {
        this.res.setHeader(InertiaHeaders.Location, url);
        this.res.status(409);
    }
}
