import type { NextFunction, Request, Response } from "express";
import { Inertia, type ResolvedConfig } from "node-inertiajs";
import type { ViteDevServer } from "vite";

export function inertiaMiddleware(
  config: ResolvedConfig,
  vite?: ViteDevServer
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.inertia = new Inertia(req, res, config, vite);
    next();
  };
}
