import type { Response } from "express";
import type { Inertia } from "../inertia.js";
import Flash from "../flash.js";

declare global {
  namespace Express {
    export interface Response {
      inertia: Inertia;
    }

    export interface Request {
      flash: Flash;
    }
  }
}
