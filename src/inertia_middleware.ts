import { Inertia } from "./inertia.js";
import { InertiaHeaders } from "./headers.js";
import type { ResolvedConfig } from "./types.js";
import type { NextFunction, Request, Response } from "express";
import type { ViteDevServer } from "vite";

export function inertiaMiddleware(
  config: ResolvedConfig,
  vite?: ViteDevServer
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.inertia = new Inertia(req, res, config, vite);
      next();

      const isInertiaRequest = !!req.get(InertiaHeaders.Inertia);
      if (!isInertiaRequest) return;

      res.setHeader("Vary", InertiaHeaders.Inertia);

      const method = req.method;
      if (
        res.statusCode === 302 &&
        ["PUT", "PATCH", "DELETE"].includes(method)
      ) {
        res.status(303);
      }

      const version = "1";
      if (method === "GET" && req.header(InertiaHeaders.Version) !== version) {
        res.removeHeader(InertiaHeaders.Inertia);
        res.setHeader(InertiaHeaders.Location, req.url);
        res.status(409);
      }
    } catch (error: any) {
      next(error);
    }
  };
}
