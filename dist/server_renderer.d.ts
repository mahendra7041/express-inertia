import type { PageObject, ResolvedConfig } from "./types.js";
import { ViteDevServer } from "vite";
export declare class ServerRenderer {
    protected config: ResolvedConfig;
    protected vite?: ViteDevServer | undefined;
    constructor(config: ResolvedConfig, vite?: ViteDevServer | undefined);
    render(pageObject: PageObject): Promise<{
        head: any;
        body: any;
    }>;
}
