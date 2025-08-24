import type { Response } from "express";
import type { Inertia } from "../inertia_app.js";

declare global {
  namespace Express {
    export interface Response {
      inertia: Inertia;
    }
  }
}
