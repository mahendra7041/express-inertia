import type { ResolvedConfig } from "./types.js";
import type { NextFunction, Request, Response } from "express";
import { ViteDevServer } from "vite";
export declare class InertiaMiddleware {
    protected config: ResolvedConfig;
    protected vite?: ViteDevServer | undefined;
    constructor(config: ResolvedConfig, vite?: ViteDevServer | undefined);
    private resolveValidationErrors;
    private shareErrors;
    handle(req: Request, res: Response, next: NextFunction): Promise<void>;
}
