import { InertiaMiddleware } from "./inertia_middleware.js";
import type { ResolvedConfig } from "./types.js";
import { createServer, type ViteDevServer } from "vite";
import type { NextFunction, Request, Response } from "express";

async function inertia(config: ResolvedConfig, vite?: ViteDevServer) {
  const middlewares = [];

  const isProd = process.env.NODE_ENV === "production";

  if (!vite && !isProd) {
    vite = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
  }

  if (vite && !isProd) {
    middlewares.push(vite.middlewares);
  }

  const inertia = new InertiaMiddleware(config, vite);

  const inertiaMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    return await inertia.handle(req, res, next);
  };

  return [...middlewares, inertiaMiddleware];
}

export default inertia;
