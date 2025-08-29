import express, { RequestHandler } from "express";
import type { ViteDevServer } from "vite";
import type { BaseConfig, ResolvedConfig } from "./types";
import { inertiaMiddleware } from "./inertia_middleware.js";
import Flash from "./flash.js";
import defaults from "defaults";
import defaultConfig from "./default_config.js";

export default async function inertia(
  config?: BaseConfig
): Promise<RequestHandler[]> {
  const isProduction = process.env.NODE_ENV === "production";

  const newConfig = defaults<Partial<ResolvedConfig>, ResolvedConfig>(
    config ?? {},
    defaultConfig
  ) as Required<ResolvedConfig>;

  const middlewares: RequestHandler[] = [];

  let vite: ViteDevServer | undefined;
  if (!isProduction) {
    try {
      // ✅ dynamically import vite only in dev
      const { createServer: createViteServer } = await import("vite");
      vite = await createViteServer(newConfig.vite);
      middlewares.push(vite.middlewares);
    } catch (error) {
      console.error("Vite server initialization failed:", error);
      throw error;
    }
  } else {
    middlewares.push(
      express.static(newConfig.clientStaticBuildDir, {
        index: false,
      })
    );
  }

  middlewares.push(Flash.middleware);
  middlewares.push(inertiaMiddleware(newConfig, vite));

  return middlewares;
}
