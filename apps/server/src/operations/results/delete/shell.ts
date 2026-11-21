import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  deleteResultCore,
  createResultDeleteAdapter,
  type DeleteResultPort,
} from "./core.js";

export function createResultDeleteShell(
  portFactory: () => DeleteResultPort = createResultDeleteAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await deleteResultCore(port, caller, { id: req.params.id });
    res.status(200).json(result);
  };
}
