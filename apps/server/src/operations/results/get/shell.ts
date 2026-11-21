import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  getResultCore,
  createResultGetAdapter,
  type GetResultPort,
} from "./core.js";

export function createResultGetShell(
  portFactory: () => GetResultPort = createResultGetAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await getResultCore(port, caller, { id: req.params.id });
    res.status(200).json(result);
  };
}
