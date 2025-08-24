import { InertiaApp } from "./inertia_app.js";
import { InertiaHeaders } from "./headers.js";
import type { ResolvedConfig } from "./types.js";
import type { NextFunction, Request, Response } from "express";
import { ViteDevServer } from "vite";

export class Inertia {
  constructor(
    protected config: ResolvedConfig,
    protected vite?: ViteDevServer
  ) {}

  private resolveValidationErrors(req: Request, res: Response) {
    if (!res.locals.errors) {
      return {};
    }

    if (!res.locals.errors.E_VALIDATION_ERROR) {
      return res.locals.errors;
    }

    const errors = Object.entries(res.locals.errors.inputErrorsBag).reduce(
      (acc, [field, messages]) => {
        acc[field] = Array.isArray(messages) ? messages[0] : messages;
        return acc;
      },
      {} as Record<string, string>
    );

    const errorBag = req.header(InertiaHeaders.ErrorBag);
    return errorBag ? { [errorBag]: errors } : errors;
  }

  private shareErrors(req: Request, res: Response) {
    res.inertia.share({
      errors: res.inertia.always(() => this.resolveValidationErrors(req, res)),
    });
  }

  async handle(req: Request, res: Response, next: NextFunction) {
    try {
      res.inertia = new InertiaApp(req, res, this.config, this.vite);
      this.shareErrors(req, res);
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
      if (this.vite) {
        this.vite.ssrFixStacktrace(error);
      }
      next(error);
    }
  }
}
