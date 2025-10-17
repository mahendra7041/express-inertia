import type { Request, Response } from "express";
import { Adapter } from "node-inertiajs";

/**
 * Express Adapter for Inertia.js
 */
export class ExpressAdapter extends Adapter {
  constructor(protected request: Request, protected response: Response) {
    super();
  }

  getRequest(): Request {
    return this.request;
  }

  getResponse(): Response {
    return this.response;
  }

  getHeader(name: string): string | string[] | undefined {
    return this.request.headers[name.toLowerCase()];
  }

  setHeader(name: string, value: any): void {
    this.response.setHeader(name, value);
  }

  getMethod(): string {
    return this.request.method || "GET";
  }

  getUrl(): string {
    return this.request.url || "/";
  }

  json(data: Record<string, any>): void {
    this.response.json(data);
  }

  html(content: string): void {
    this.response.send(content);
  }

  redirect(statusOrUrl: number | string, url?: string): void {
    let status = 302;
    let location = "";

    if (typeof statusOrUrl === "number" && typeof url === "string") {
      status = statusOrUrl;
      location = url;
    } else if (typeof statusOrUrl === "string") {
      location = statusOrUrl;
    }

    this.response.redirect(status, location);
  }

  setStatus(code: number): void {
    this.response.status(code);
  }

  end(data?: any): void {
    this.response.end(data);
  }
}
