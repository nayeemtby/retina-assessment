import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  bootstrapCore,
  createBootstrapAdapter,
  type BootstrapPort,
} from "./core.js";

export function createBootstrapShell(
  portFactory: () => BootstrapPort = createBootstrapAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await bootstrapCore(port, caller, req.body);
    res.status(200).json(result);
  };
}
