import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  listResultsCore,
  createResultListAdapter,
  type ListResultsPort,
} from "./core.js";

export function createResultListShell(
  portFactory: () => ListResultsPort = createResultListAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await listResultsCore(port, caller, req.query as any);
    res.status(200).json(result);
  };
}
