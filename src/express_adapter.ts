import type { Request, Response } from "express";
import { Adapter } from "node-inertiajs";

export class ExpressAdapter extends Adapter {
  constructor(protected req: Request, protected res: Response) {
    super();
  }

  get url(): string {
    return this.req.url || "/";
  }

  get method(): string {
    return this.req.method;
  }

  get statusCode(): number {
    return this.res.statusCode;
  }

  set statusCode(code: number) {
    this.res.status(code);
  }

  get request(): Request {
    return this.req;
  }

  get response(): Response {
    return this.res;
  }

  getHeader(name: string): string | string[] | undefined {
    return this.req.get(name) || undefined;
  }

  setHeader(name: string, value: string): void {
    this.res.setHeader(name, value);
  }

  send(content: string): void {
    if (!this.res.getHeader("Content-Type")) {
      this.res.setHeader("Content-Type", "text/html");
    }
    this.res.send(content);
  }

  json(data: unknown): void {
    this.res.json(data);
  }

  redirect(statusOrUrl: number | string, url?: string): void {
    if (typeof statusOrUrl === "number" && typeof url === "string") {
      this.res.redirect(statusOrUrl, url);
    } else if (typeof statusOrUrl === "string") {
      this.res.redirect(statusOrUrl);
    } else {
      throw new Error("Invalid redirect arguments");
    }
  }
}
