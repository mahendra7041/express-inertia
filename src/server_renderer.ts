import { pathToFileURL } from "node:url";
import type { PageObject, ResolvedConfig } from "./types.js";
import type { ViteDevServer } from "vite";

export class ServerRenderer {
  constructor(
    protected config: ResolvedConfig,
    protected vite?: ViteDevServer
  ) {}

  async render(pageObject: PageObject) {
    let render: any;

    const isProduction = process.env.NODE_ENV === "production";

    if (!isProduction && this.vite) {
      render = await this.vite.ssrLoadModule(this.config.ssrEntrypoint!);
    } else {
      render = await import(
        pathToFileURL(this.config.ssrBuildEntrypoint!).href
      );
    }

    const result = await render.default(pageObject);
    return { head: result.head, body: result.body };
  }
}
