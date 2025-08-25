import { pathToFileURL } from "node:url";
export class ServerRenderer {
    constructor(config, vite) {
        this.config = config;
        this.vite = vite;
    }
    async render(pageObject) {
        let render;
        if (this.vite) {
            render = await this.vite.ssrLoadModule(this.config.ssr.entrypoint);
        }
        else {
            render = await import(pathToFileURL(this.config.ssr.bundle).href);
        }
        const result = await render.default(pageObject);
        return { head: result.head, body: result.body };
    }
}
