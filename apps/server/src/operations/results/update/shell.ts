import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  updateResultCore,
  createResultUpdateAdapter,
  type UpdateResultPort,
} from "./core.js";

export function createResultUpdateShell(
  portFactory: () => UpdateResultPort = createResultUpdateAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await updateResultCore(port, caller, {
      id: req.params.id,
      data: req.body,
    });
    res.status(200).json(result);
  };
}
