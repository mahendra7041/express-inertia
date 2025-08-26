import type { ResolvedConfig } from "./types.js";
import type { NextFunction, Request, Response } from "express";
import type { ViteDevServer } from "vite";
export declare function inertiaMiddleware(config: ResolvedConfig, vite?: ViteDevServer): (req: Request, res: Response, next: NextFunction) => Promise<void>;
