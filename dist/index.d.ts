import type { ResolvedConfig } from "./types.js";
import { type ViteDevServer } from "vite";
import type { NextFunction, Request, Response } from "express";
declare function inertia(config: ResolvedConfig, vite?: ViteDevServer): Promise<(import("vite").Connect.Server | ((req: Request, res: Response, next: NextFunction) => Promise<void>))[]>;
export default inertia;
