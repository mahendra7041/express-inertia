import type { Request, Response, NextFunction } from "express";

type FlashStore = Record<string, any>;

export default class Flash {
  constructor(protected req: Request, protected res: Response) {
    if (!this.req.session) {
      throw new Error("Flash requires express-session middleware.");
    }

    if (!this.req.session.flash) {
      this.req.session.flash = {};
    }
  }

  static middleware(req: Request, res: Response, next: NextFunction): void {
    if (!req.session) {
      throw new Error("Flash middleware requires express-session middleware.");
    }

    if (!req.session.flash) {
      req.session.flash = {};
    }

    req.flash = new Flash(req, res);

    next();
  }

  get(key: string): any {
    const value = this.req.session.flash![key];
    delete this.req.session.flash![key];
    return value;
  }

  set(key: string, value: any): any {
    this.req.session.flash![key] = value;
    return value;
  }

  has(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.req.session.flash!, key);
  }

  all(): FlashStore {
    const messages = { ...this.req.session.flash! };
    this.req.session.flash = {};
    return messages;
  }

  clear(): void {
    this.req.session.flash = {};
  }

  peek(key: string): any {
    return this.req.session.flash![key];
  }
}
