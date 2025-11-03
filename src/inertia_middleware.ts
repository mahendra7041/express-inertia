import type { NextFunction, Request, Response } from "express";
import { Inertia, type ResolvedConfig } from "node-inertiajs";
import type { ViteDevServer } from "vite";
import { ExpressAdapter } from "./express_adapter";

export function inertiaMiddleware(
  config: ResolvedConfig,
  vite?: ViteDevServer
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const adapter = new ExpressAdapter(req, res);
    res.inertia = new Inertia(adapter, config, vite);
    next();
  };
}
