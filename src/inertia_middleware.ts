import { Inertia } from "./inertia.js";
import type { BaseConfig, ResolvedConfig } from "./types.js";
import type { NextFunction, Request, Response } from "express";
import type { ViteDevServer } from "vite";

export function inertiaMiddleware(
  config: ResolvedConfig & Required<BaseConfig>,
  vite?: ViteDevServer
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.inertia = new Inertia(req, res, config, vite);
    next();
  };
}
