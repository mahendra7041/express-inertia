import type { Response } from "express";
import type { Inertia } from "../inertia.js";

declare global {
  namespace Express {
    export interface Response {
      inertia: Inertia;
    }
  }
}
