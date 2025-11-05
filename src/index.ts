import type { RequestHandler, Request } from "express";
import { defineConfig, Flash, InertiaConfig } from "node-inertiajs";
import type { ViteDevServer } from "vite";
import { inertiaMiddleware } from "./inertia_middleware.js";

export * from "node-inertiajs";
export { ExpressAdapter } from "./express_adapter.js";

export default async function inertia(
  config?: InertiaConfig
): Promise<RequestHandler[]> {
  const isProduction = process.env.NODE_ENV === "production";

  const resolvedConfig = defineConfig(config || ({} as InertiaConfig));

  resolvedConfig.sharedData = {
    errors: (request: Request) => request.flash.get("errors") || {},
    flash: (request: Request) => {
      return {
        error: request.flash.get("error") || null,
        success: request.flash.get("success") || null,
      };
    },
    ...resolvedConfig.sharedData,
  };

  const middlewares: RequestHandler[] = [];

  let vite: ViteDevServer | undefined;
  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import("vite");
      vite = await createViteServer(resolvedConfig.vite as any);
      middlewares.push(vite.middlewares);
    } catch (error) {
      console.error("Vite server initialization failed:", error);
      throw error;
    }
  }

  middlewares.push(Flash.middleware);
  middlewares.push(inertiaMiddleware(resolvedConfig, vite));

  return middlewares;
}
